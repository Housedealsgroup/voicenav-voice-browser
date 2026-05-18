// VoiceNav Action Executor v5 — enhanced with security hardening: URL validation, input sanitization, destructive action confirmation
const ACTION_EXECUTOR_SCRIPT = `
(function() {

  // --- URL Validation ---
  var ALLOWED_NAV_PROTOCOLS = ['http:', 'https:'];
  var BLOCKED_NAV_DOMAINS = [
    'malware.com', 'phishing-site.net', 'evil-download.com',
    'free-prize-scam.xyz', 'credential-stealer.top',
    'fake-bank-login.com', 'ransomware-host.biz',
    'cryptojacker.io', 'adware-push.info',
    'tech-support-scam.com', 'fake-update.net',
  ];

  function isValidNavigationUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      var parsed = new URL(url);
      if (ALLOWED_NAV_PROTOCOLS.indexOf(parsed.protocol) < 0) return false;
      var hostname = parsed.hostname.toLowerCase();
      for (var i = 0; i < BLOCKED_NAV_DOMAINS.length; i++) {
        if (hostname === BLOCKED_NAV_DOMAINS[i] || hostname.endsWith('.' + BLOCKED_NAV_DOMAINS[i])) {
          return false;
        }
      }
      // Block data: URLs with HTML content
      if (/^data:text\\/html/i.test(url)) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Input Sanitization ---
  var MAX_TEXT_LENGTH = 10000;

  function sanitizeTextInput(text) {
    if (typeof text !== 'string') return '';
    // Trim to max length
    var sanitized = text.substring(0, MAX_TEXT_LENGTH);
    // Remove null bytes and dangerous control chars (keep newline, tab, carriage return)
    sanitized = sanitized.replace(/[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]/g, '');
    // Remove Unicode line/paragraph separators that can break JS parsing
    sanitized = sanitized.replace(/[\\u2028\\u2029]/g, '');
    return sanitized;
  }

  // --- Destructive Action Confirmation ---
  var DESTRUCTIVE_ACTIONS = ['submit', 'delete', 'remove', 'clear'];
  var CONFIRM_TIMEOUT_MS = 30000;

  // Pending confirmations store
  var pendingConfirmations = {};

  function requestConfirmation(action, elementId, callback) {
    var confirmId = 'conf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    pendingConfirmations[confirmId] = {
      action: action,
      elementId: elementId,
      callback: callback,
      timestamp: Date.now(),
    };
    // Post confirmation request to native side
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONFIRM_REQUEST',
        data: {
          confirmId: confirmId,
          action: action,
          elementId: elementId,
          message: 'Confirm ' + action + ' action? This may be destructive.',
        }
      }));
    }
    // Auto-expire stale confirmations
    setTimeout(function() {
      if (pendingConfirmations[confirmId]) {
        delete pendingConfirmations[confirmId];
      }
    }, CONFIRM_TIMEOUT_MS);
    return confirmId;
  }

  // Called from native side to approve/deny a pending confirmation
  function resolveConfirmation(confirmId, approved) {
    var pending = pendingConfirmations[confirmId];
    if (!pending) return { success: false, error: 'Confirmation expired or not found' };
    delete pendingConfirmations[confirmId];
    if (approved && pending.callback) {
      return pending.callback();
    }
    return { success: false, error: 'Action cancelled by user' };
  }

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
    var rect = el.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    // Touch events for mobile frameworks
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));
  }

  function simulateDoubleClick(el) {
    var rect = el.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    simulateClick(el);
    setTimeout(function() {
      simulateClick(el);
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    }, 50);
  }

  function simulateRightClick(el) {
    var rect = el.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  }

  function simulateHover(el) {
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
  }

  function simulateType(el, text) {
    el.focus();
    // Clear existing value
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    // Type character by character for React compatibility
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
      el.value = text.substring(0, i + 1);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    }
    // React native input value setter
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(el, text);
    }
    var nativeTextareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (nativeTextareaSetter && nativeTextareaSetter.set && el.tagName === 'TEXTAREA') {
      nativeTextareaSetter.set.call(el, text);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function simulateSelect(el, value) {
    el.focus();
    var options = el.querySelectorAll('option');
    for (var i = 0; i < options.length; i++) {
      if (options[i].textContent.toLowerCase().indexOf(value.toLowerCase()) >= 0 || options[i].value.toLowerCase() === value.toLowerCase()) {
        el.value = options[i].value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  function simulateKeypress(key) {
    var keyMap = {
      'enter': { key: 'Enter', code: 'Enter', keyCode: 13 },
      'escape': { key: 'Escape', code: 'Escape', keyCode: 27 },
      'tab': { key: 'Tab', code: 'Tab', keyCode: 9 },
      'backspace': { key: 'Backspace', code: 'Backspace', keyCode: 8 },
      'delete': { key: 'Delete', code: 'Delete', keyCode: 46 },
      'arrowup': { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
      'arrowdown': { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
      'arrowleft': { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
      'arrowright': { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
      'space': { key: ' ', code: 'Space', keyCode: 32 },
    };
    // Handle key combos like ctrl+f
    var parts = key.toLowerCase().split('+');
    var mainKey = parts[parts.length - 1];
    var ctrl = parts.indexOf('ctrl') >= 0;
    var shift = parts.indexOf('shift') >= 0;
    var alt = parts.indexOf('alt') >= 0;
    var meta = parts.indexOf('meta') >= 0 || parts.indexOf('cmd') >= 0;

    var keyData = keyMap[mainKey] || { key: mainKey, code: 'Key' + mainKey.toUpperCase(), keyCode: mainKey.charCodeAt(0) - 32 };

    var event = new KeyboardEvent('keydown', {
      key: keyData.key,
      code: keyData.code,
      keyCode: keyData.keyCode,
      which: keyData.keyCode,
      ctrlKey: ctrl,
      shiftKey: shift,
      altKey: alt,
      metaKey: meta,
      bubbles: true,
      cancelable: true
    });
    document.activeElement.dispatchEvent(event);
    document.dispatchEvent(event);

    // Also dispatch keypress and keyup
    var pressEvent = new KeyboardEvent('keypress', { key: keyData.key, code: keyData.code, keyCode: keyData.keyCode, bubbles: true });
    document.dispatchEvent(pressEvent);
    var upEvent = new KeyboardEvent('keyup', { key: keyData.key, code: keyData.code, keyCode: keyData.keyCode, bubbles: true });
    document.dispatchEvent(upEvent);
  }

  function fillForm(fields) {
    var results = [];
    for (var i = 0; i < fields.length; i++) {
      var el = findElement(fields[i].elementId);
      if (el) {
        var safeValue = sanitizeTextInput(fields[i].value);
        simulateType(el, safeValue);
        results.push({ id: fields[i].elementId, success: true });
      } else {
        results.push({ id: fields[i].elementId, success: false, error: 'Element not found' });
      }
    }
    return results;
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

        case 'doubleClick': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          scrollToElement(el);
          setTimeout(function() { simulateDoubleClick(el); }, 200);
          return { success: true };
        }

        case 'rightClick': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          scrollToElement(el);
          setTimeout(function() { simulateRightClick(el); }, 200);
          return { success: true };
        }

        case 'hover': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          simulateHover(el);
          return { success: true };
        }

        case 'focus': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          el.focus();
          el.dispatchEvent(new Event('focus', { bubbles: true }));
          return { success: true };
        }

        case 'type': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          // Sanitize input text before typing
          var safeText = sanitizeTextInput(action.text);
          scrollToElement(el);
          setTimeout(function() { simulateType(el, safeText); }, 200);
          return { success: true };
        }

        case 'select': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          var safeValue = sanitizeTextInput(action.value);
          var result = simulateSelect(el, safeValue);
          return { success: result };
        }

        case 'scroll': {
          var scrollAmount = window.innerHeight * 0.7;
          if (action.direction === 'down') window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
          else if (action.direction === 'up') window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
          else if (action.direction === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
          else if (action.direction === 'bottom') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          else if (action.direction === 'left') window.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
          else if (action.direction === 'right') window.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          return { success: true };
        }

        case 'navigate': {
          // Validate URL before navigation
          if (!isValidNavigationUrl(action.url)) {
            return { success: false, error: 'Blocked navigation to unsafe or blacklisted URL' };
          }
          window.location.href = action.url;
          return { success: true };
        }

        case 'submit': {
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found: ' + action.elementId };
          // Require confirmation for destructive submit actions
          if (action.confirmed !== true) {
            return requestConfirmation('submit', action.elementId, function() {
              var form = el.closest('form');
              if (form) { form.submit(); } else { simulateKeypress('enter'); }
              return { success: true, confirmed: true };
            });
          }
          var form = el.closest('form');
          if (form) {
            form.submit();
          } else {
            simulateKeypress('enter');
          }
          return { success: true };
        }

        case 'delete': {
          // Destructive action — require confirmation
          if (action.confirmed !== true) {
            return requestConfirmation('delete', action.elementId, function() {
              var el = findElement(action.elementId);
              if (!el) return { success: false, error: 'Element not found' };
              el.remove();
              return { success: true, confirmed: true };
            });
          }
          var el = findElement(action.elementId);
          if (!el) return { success: false, error: 'Element not found' };
          el.remove();
          return { success: true };
        }

        case 'back': {
          window.history.back();
          return { success: true };
        }

        case 'forward': {
          window.history.forward();
          return { success: true };
        }

        case 'refresh': {
          window.location.reload();
          return { success: true };
        }

        case 'keypress': {
          simulateKeypress(action.key);
          return { success: true };
        }

        case 'fillForm': {
          var results = fillForm(action.fields || []);
          return { success: true, results: results };
        }

        case 'multiClick': {
          var ids = action.elementIds || [];
          var results = [];
          for (var i = 0; i < ids.length; i++) {
            var el = findElement(ids[i]);
            if (el) {
              simulateClick(el);
              results.push({ id: ids[i], success: true });
            } else {
              results.push({ id: ids[i], success: false });
            }
          }
          return { success: true, results: results };
        }

        default:
          return { success: false, error: 'Unknown action: ' + action.action };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (typeof window.__vn_executeAction === 'undefined') {
    window.__vn_executeAction = executeAction;
  }
  if (typeof window.__vn_resolveConfirmation === 'undefined') {
    window.__vn_resolveConfirmation = resolveConfirmation;
  }
})();
`;

module.exports = ACTION_EXECUTOR_SCRIPT;
