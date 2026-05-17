// VoiceNav Action Executor — injected into WebView to execute actions on the page
// Enhanced with retry logic, better scrolling, and form interaction
const ACTION_EXECUTOR_SCRIPT = `
(function() {
  function findElement(elementId) {
    return document.querySelector('[data-vn-id="' + elementId + '"]');
  }

  function scrollToElement(el) {
    var rect = el.getBoundingClientRect();
    var isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function simulateClick(el) {
    // Dispatch full mouse event sequence for frameworks that listen to mousedown/mouseup
    var rect = el.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  }

  function simulateType(el, text) {
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    // React compatibility
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(el, text);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function executeAction(action) {
    try {
      switch (action.action) {
        case 'click': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          scrollToElement(el);
          setTimeout(function() { simulateClick(el); }, 300);
          return { success: true };
        }

        case 'type': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          scrollToElement(el);
          setTimeout(function() { simulateType(el, action.text); }, 200);
          return { success: true };
        }

        case 'select': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          el.value = action.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }

        case 'scroll': {
          var scrollAmount = window.innerHeight * 0.7;
          if (action.direction === 'down') window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          else if (action.direction === 'up') window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          else if (action.direction === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
          else if (action.direction === 'bottom') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          return { success: true };
        }

        case 'navigate': {
          window.location.href = action.url;
          return { success: true };
        }

        case 'submit': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          var form = el.closest('form');
          if (form) {
            form.submit();
          } else {
            // Try pressing Enter on the element
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          }
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

  // Expose for direct calls from injected JS
  if (typeof window.__vn_executeAction === 'undefined') {
    window.__vn_executeAction = executeAction;
  }
})();
`;

module.exports = ACTION_EXECUTOR_SCRIPT;
