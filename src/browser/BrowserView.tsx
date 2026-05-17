import { WebView, WebViewMessageEvent } from 'react-native-webview';
import React, { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { COLORS } from '../a11y/theme';

const DOM_EXTRACTOR = require('./domExtractor.js').default || '';
const ACTION_EXECUTOR = require('./actionExecutor.js').default || '';

type BrowserViewProps = {
  url: string;
  onSnapshot: (snapshot: any) => void;
  onAction: (result: any) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onError: (error: string) => void;
  onNavigationStateChange?: (navState: any) => void;
};

export type BrowserViewHandle = {
  extractDOM: () => void;
  executeAction: (action: any) => void;
  navigate: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  injectJS: (js: string) => void;
};

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

  useImperativeHandle(ref, () => ({
    extractDOM: () => {
      webViewRef.current?.injectJavaScript(`
        (function() {
          var event = new CustomEvent('extractDOM');
          window.dispatchEvent(event);
          // Run the extractor
          try {
            var result = (function() {
              ${DOM_EXTRACTOR.replace(/.*return JSON\.stringify\(snapshot\);.*/, 'return JSON.stringify(snapshot);')}
            })();
          } catch(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ERROR', data: {message: e.message}}));
            }
          }
          true;
        })();
      `);
    },
    executeAction: (action: any) => {
      const js = `
        (function() {
          var data = JSON.parse('${JSON.stringify(action)}');
          try {
            var result = (function(action) {
              ${ACTION_EXECUTOR.replace(/.*executeAction\(data\.action\);/, '').replace(/function executeAction/, 'function doAction')}
              // Inline the executeAction function
              var el = document.querySelector('[data-vn-id="' + action.elementId + '"]');
              if (action.action === 'click' && el) {
                el.scrollIntoView({behavior:'smooth',block:'center'});
                setTimeout(function(){el.click();},300);
                return {success:true};
              } else if (action.action === 'type' && el) {
                el.scrollIntoView({behavior:'smooth',block:'center'});
                el.focus();
                el.value = action.text;
                el.dispatchEvent(new Event('input',{bubbles:true}));
                el.dispatchEvent(new Event('change',{bubbles:true}));
                return {success:true};
              } else if (action.action === 'scroll') {
                var amt = window.innerHeight * 0.7;
                if(action.direction==='down') window.scrollBy(0,amt);
                else if(action.direction==='up') window.scrollBy(0,-amt);
                else if(action.direction==='top') window.scrollTo(0,0);
                else if(action.direction==='bottom') window.scrollTo(0,document.documentElement.scrollHeight);
                return {success:true};
              } else if (action.action === 'navigate') {
                window.location.href = action.url;
                return {success:true};
              } else if (action.action === 'back') {
                window.history.back();
                return {success:true};
              } else if (action.action === 'submit' && el) {
                var form = el.closest('form');
                if(form){form.submit();return {success:true};}
                el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
                return {success:true};
              }
              return {success:false, error:'action failed'};
            })(data);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type:'ACTION_RESULT',data:result}));
            }
          } catch(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({type:'ACTION_RESULT',data:{success:false,error:e.message}}));
            }
          }
          true;
        })();
      `;
      webViewRef.current?.injectJavaScript(js);
    },
    navigate: (newUrl: string) => {
      webViewRef.current?.injectJavaScript(`window.location.href='${newUrl}';true;`);
    },
    goBack: () => webViewRef.current?.goBack(),
    goForward: () => webViewRef.current?.goForward(),
    reload: () => webViewRef.current?.reload(),
    injectJS: (js: string) => webViewRef.current?.injectJavaScript(js),
  }));

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      switch (msg.type) {
        case 'PAGE_SNAPSHOT':
          onSnapshot(msg.data);
          break;
        case 'ACTION_RESULT':
          onAction(msg.data);
          break;
        case 'ERROR':
          onError(msg.data.message);
          break;
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [onSnapshot, onAction, onError]);

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
        injectedJavaScriptBeforeContentLoaded={`
          window.VoiceNavReady = true;
          true;
        `}
        onMessage={handleMessage}
        onLoadStart={onLoadStart}
        onLoadEnd={() => {
          onLoadEnd();
          // Auto-extract DOM after page loads
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              (function() {
                ${DOM_EXTRACTOR}
                true;
              })();
            `);
          }, 500);
        }}
        onError={(e) => onError(e.nativeEvent.description)}
        onNavigationStateChange={onNavigationStateChange}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 VoiceNav/1.0"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  webview: {
    flex: 1,
  },
});

export default BrowserView;
