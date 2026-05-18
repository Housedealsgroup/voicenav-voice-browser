import { WebView, WebViewMessageEvent } from 'react-native-webview';
import React, { useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../a11y/theme';
import type { PageSnapshot, AgentAction } from './types';
import { logger } from '../utils/logger';

// --- Content Security Policy ---
const CSP_POLICY = [
  "default-src 'self' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "media-src 'self' https: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https:",
  "frame-ancestors 'none'",
  "block-all-mixed-content",
].join('; ');

const CSP_INJECT = `
(function() {
  try {
    var meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = ${JSON.stringify(CSP_POLICY)};
    if (document.head) document.head.insertBefore(meta, document.head.firstChild);
  } catch(e) {}
})();
`;

// --- Malware / Phishing Domain Blacklist ---
// Curated list of known-malicious domains and patterns (updated periodically)
const MALWARE_DOMAIN_BLACKLIST: ReadonlySet<string> = new Set([
  'malware.com', 'phishing-site.net', 'evil-download.com',
  'free-prize-scam.xyz', 'credential-stealer.top',
  'fake-bank-login.com', 'ransomware-host.biz',
  'cryptojacker.io', 'adware-push.info',
  'tech-support-scam.com', 'fake-update.net',
]);

// Patterns that indicate suspicious domains
const SUSPICIOUS_DOMAIN_PATTERNS: readonly RegExp[] = [
  /\.(ru|cn|tk|ml|ga|cf|gq)\/malware/i,
  /login.*\.(tk|ml|ga|cf|gq)$/i,
  /paypal.*secure.*\d{5,}/i,
  /bank.*verify.*token/i,
  /free.*iphone.*claim/i,
  /amazon.*winner.*prize/i,
];

function isBlacklistedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    // Check exact match and parent domain
    const parts = hostname.split('.');
    for (let i = 0; i < parts.length; i++) {
      const domain = parts.slice(i).join('.');
      if (MALWARE_DOMAIN_BLACKLIST.has(domain)) return true;
    }
    // Check suspicious patterns
    for (const pattern of SUSPICIOUS_DOMAIN_PATTERNS) {
      if (pattern.test(hostname)) return true;
    }
  } catch { /* invalid URL already blocked elsewhere */ }
  return false;
}

// --- Request Interceptor ---
// Suspicious URL patterns to block before navigation
const SUSPICIOUS_URL_PATTERNS: readonly RegExp[] = [
  /^\s*javascript:/i,
  /^\s*data:text\/html/i,
  /^\s*data:application\/x-/i,
  /^\s*vbscript:/i,
  /^\s*blob:/i,
  /\/wp-admin\/admin-ajax\.php.*eval/i,
  /\.exe(\?|$)/i,
  /\.dll(\?|$)/i,
  /\.scr(\?|$)/i,
  /\.bat(\?|$)/i,
  /\.cmd(\?|$)/i,
  /base64,.*<script/i,
];

function isSuspiciousUrl(url: string): boolean {
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

// Read injected scripts as raw strings via Metro's require + toString
const DOM_EXTRACTOR = (() => {
  try {
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
// Handles null bytes, Unicode line/paragraph separators, and all control characters
function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\0/g, '\\0')            // null byte
    .replace(/\u2028/g, '\\u2028')    // Unicode Line Separator
    .replace(/\u2029/g, '\\u2029')    // Unicode Paragraph Separator
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, (ch) =>
      '\\x' + ch.charCodeAt(0).toString(16).padStart(2, '0')
    );
}

// Validate URL scheme — only allow http/https
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return !/^\s*(javascript|data|blob|vbscript):/i.test(url);
  }
}

// Combined security check: safe scheme + not blacklisted + not suspicious pattern
function isSecureUrl(url: string): boolean {
  if (!isSafeUrl(url)) return false;
  if (isBlacklistedDomain(url)) return false;
  if (isSuspiciousUrl(url)) return false;
  return true;
}

const INJECTED_SCRIPTS = `
  ${CSP_INJECT}
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
      if (!isSecureUrl(newUrl)) {
        const reason = isBlacklistedDomain(newUrl)
          ? 'Blocked blacklisted domain'
          : isSuspiciousUrl(newUrl)
            ? 'Blocked suspicious URL pattern'
            : 'Blocked unsafe URL';
        logger.browser('blockedNavigation', { reason, url: newUrl.substring(0, 80) });
        onError(reason + ': ' + newUrl.substring(0, 50));
        return;
      }
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
        logger.browser('messageParseError', e);
      }
    },
    [onSnapshot, onAction, onError]
  );

  const handleLoadEnd = useCallback(() => {
    onLoadEnd();
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
    if (!isSecureUrl(request.url)) {
      const reason = isBlacklistedDomain(request.url)
        ? 'Blocked blacklisted domain'
        : isSuspiciousUrl(request.url)
          ? 'Blocked suspicious URL pattern'
          : 'Blocked navigation to unsafe URL';
      logger.browser('blockedLoadRequest', { reason, url: request.url.substring(0, 80) });
      onError(reason);
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
        // Security: disable file access from web content
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        // Security: limit web content permissions
        mediaPlaybackRequiresUserAction={true}
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
