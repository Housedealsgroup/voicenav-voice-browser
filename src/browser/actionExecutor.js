// Injected into WebView to execute actions on the page
(function() {
  function findElement(elementId) {
    return document.querySelector('[data-vn-id="' + elementId + '"]');
  }

  function scrollToElement(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function executeAction(action) {
    try {
      switch (action.action) {
        case 'click': {
          const el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          scrollToElement(el);
          setTimeout(function() { el.click(); }, 300);
          return { success: true };
        }

        case 'type': {
          const el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          scrollToElement(el);
          el.focus();
          el.value = action.text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }

        case 'select': {
          const el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          el.value = action.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }

        case 'scroll': {
          var scrollAmount = window.innerHeight * 0.7;
          if (action.direction === 'down') window.scrollBy(0, scrollAmount);
          else if (action.direction === 'up') window.scrollBy(0, -scrollAmount);
          else if (action.direction === 'top') window.scrollTo(0, 0);
          else if (action.direction === 'bottom') window.scrollTo(0, document.documentElement.scrollHeight);
          return { success: true };
        }

        case 'navigate': {
          window.location.href = action.url;
          return { success: true };
        }

        case 'submit': {
          const el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          const form = el.closest('form');
          if (form) { form.submit(); return { success: true }; }
          // Try pressing Enter on the element
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
          return { success: true };
        }

        case 'back': {
          window.history.back();
          return { success: true };
        }

        default:
          return { success: false, error: 'Unknown action: ' + action.action };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Listen for messages from React Native
  window.addEventListener('message', function(event) {
    try {
      var data = JSON.parse(event.data);
      if (data.type === 'EXECUTE_ACTION') {
        var result = executeAction(data.action);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ACTION_RESULT',
            data: result
          }));
        }
      }
    } catch (e) {}
  });

  return 'action_executor_ready';
})();
