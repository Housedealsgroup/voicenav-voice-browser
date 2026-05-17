import { WebView, WebViewMessageEvent } from 'react-native-webview';
import React, { useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../a11y/theme';
import type { PageSnapshot, AgentAction } from './types';

// Read injected scripts as raw strings via Metro's require + toString
const DOM_EXTRACTOR = (() => {
  try {
    // Metro bundles .js files as modules; we need the source as a string.
    // The files are IIFEs, so we wrap them in a function and call toString().
    const fn = require('./domExtractor.js');
    return typeof fn === 'string' ? fn : '';
  } catch {
    return '';
  }
})();

const ACTION_EXECUTOR = (() => {
  try {
    const fn = require('./actionExecutor.js');
    return typeof fn === 'string' ? fn : '';
  } catch {
    return '';
  }
})();

type BrowserViewProps = {
  url: string;
  onSnapshot: (snapshot: PageSnapshot) => void;
  onAction: (result: { success: boolean; error?: string }) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onError: (error: string) => void;
  onNavigationStateChange?: (navState: { url: string; canGoBack: boolean; canGoForward: boolean; loading: boolean; title: string }) => void;
};

export type BrowserViewHandle = {
  extractDOM: () => void;
  executeAction: (action: AgentAction) => void;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
};

// Escape a string for safe embedding inside a single-quoted JS string literal
function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// Validate URL scheme — only allow http/https
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // If URL parsing fails, check for dangerous schemes
    return !/^\s*(javascript|data|blob|vbscript):/i.test(url);
  }
}

const INJECTED_SCRIPTS = `
  ${DOM_EXTRACTOR}
  ${ACTION_EXECUTOR}
  true;
`;

const BrowserView = forwardRef<BrowserViewHandle, BrowserViewProps>(({
  url,
  onSnapshot,
  onAction,
  onLoadStart,
  onLoadEnd,
  onError,
  onNavigationStateChange,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const extractTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (extractTimeoutRef.current) {
        clearTimeout(extractTimeoutRef.current);
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    extractDOM: () => {
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var snapshot = __vn_extractDOM();
            if (window.ReactNativeWebView && snapshot) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SNAPSHOT', data: snapshot}));
            }
          } catch(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', data: {message: e.message}}));
            }
          }
        })();
        true;
      `);
    },

    executeAction: (action: AgentAction) => {
      // Serialize action data safely via JSON.stringify, then escape for JS embedding
      const actionJson = JSON.stringify(action);
      const escaped = escapeForJS(actionJson);
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var action = JSON.parse('${escaped}');
            var result = __vn_executeAction(action);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ACTION_RESULT', data: result}));
            }
          } catch(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ACTION_RESULT', data: {success: false, error: e.message}}));
            }
          }
        })();
        true;
      `);
    },

    navigate: (newUrl: string) => {
      if (!isSafeUrl(newUrl)) {
        onError('Blocked unsafe URL: ' + newUrl.substring(0, 50));
        return;
      }
      // Use postMessage to safely communicate URL to injected script
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var url = decodeURIComponent('${encodeURIComponent(newUrl)}');
            window.location.href = url;
          } catch(e) {}
        })();
        true;
      `);
    },

    goBack: () => {
      webViewRef.current?.goBack();
    },

    goForward: () => {
      webViewRef.current?.goForward();
    },

    reload: () => {
      webViewRef.current?.reload();
    },
  }));

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        switch (msg.type) {
          case 'SNAPSHOT':
            onSnapshot(msg.data as PageSnapshot);
            break;
          case 'ACTION_RESULT':
            onAction(msg.data as { success: boolean; error?: string });
            break;
          case 'ERROR':
            onError(msg.data?.message || 'Unknown error from page');
            break;
        }
      } catch (e) {
        // Log parse errors for debugging rather than silently swallowing
        console.warn('[VoiceNav] Failed to parse WebView message:', e);
      }
    },
    [onSnapshot, onAction, onError]
  );

  const handleLoadEnd = useCallback(() => {
    onLoadEnd();
    // Auto-extract DOM after page load with cleanup tracking
    if (extractTimeoutRef.current) {
      clearTimeout(extractTimeoutRef.current);
    }
    extractTimeoutRef.current = setTimeout(() => {
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var snapshot = __vn_extractDOM();
            if (window.ReactNativeWebView && snapshot) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'SNAPSHOT', data: snapshot}));
            }
          } catch(e) {}
        })();
        true;
      `);
    }, 500);
  }, [onLoadEnd]);

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    // Block dangerous URL schemes
    if (!isSafeUrl(request.url)) {
      onError('Blocked navigation to unsafe URL');
      return false;
    }
    return true;
  }, [onError]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        injectedJavaScript={INJECTED_SCRIPTS}
        onMessage={handleMessage}
        onLoadStart={onLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={(e) => onError(e.nativeEvent.description)}
        onHttpError={(e) => onError(`HTTP ${e.nativeEvent.statusCode}`)}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        allowsBackForwardNavigationGestures={true}
        decelerationRate="normal"
        // Security: no shared cookies across sites
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        // Accessibility
        accessibilityLabel="Web browser"
        accessibilityHint="VoiceNav browser view"
      />
    </View>
  );
});

BrowserView.displayName = 'BrowserView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
});

export default BrowserView;
