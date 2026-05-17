// Injected into WebView to extract a structured snapshot of the page
(function() {
  const INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'menuitem', 'tab', 'option', 'searchbox', 'spinbutton', 'slider', 'switch'];

  function getRole(el) {
    const role = el.getAttribute('role');
    if (role) return role;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a') return 'link';
    if (tag === 'button') return 'button';
    if (tag === 'input') return el.type || 'textbox';
    if (tag === 'select') return 'combobox';
    if (tag === 'textarea') return 'textbox';
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') return 'heading';
    if (tag === 'p') return 'paragraph';
    if (tag === 'img') return 'image';
    if (tag === 'nav') return 'navigation';
    if (tag === 'main') return 'main';
    if (tag === 'form') return 'form';
    return 'generic';
  }

  function getLabel(el) {
    // aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    // associated label
    if (el.id) {
      const label = document.querySelector('label[for="' + el.id + '"]');
      if (label) return label.textContent.trim();
    }
    // parent label
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    // title or placeholder
    return el.getAttribute('title') || el.getAttribute('placeholder') || '';
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isInteractive(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    const role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES.includes(role)) return true;
    if (el.onclick || el.getAttribute('onclick')) return true;
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) >= 0) return true;
    return false;
  }

  function extractText(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    // Remove scripts and styles
    clone.querySelectorAll('script, style, noscript, svg').forEach(function(s) { s.remove(); });
    return (clone.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 500);
  }

  let idCounter = 0;
  const elements = [];
  const allElements = document.querySelectorAll('*');

  allElements.forEach(function(el) {
    if (!isVisible(el)) return;

    const role = getRole(el);
    const interactive = isInteractive(el);
    const rect = el.getBoundingClientRect();

    // Collect interactive elements and headings/paragraphs for context
    if (interactive || role === 'heading' || role === 'paragraph' || role === 'navigation' || role === 'main') {
      const elemId = ++idCounter;
      el.setAttribute('data-vn-id', elemId);

      elements.push({
        id: elemId,
        role: role,
        tag: el.tagName.toLowerCase(),
        text: extractText(el).substring(0, 200),
        label: getLabel(el),
        placeholder: el.getAttribute('placeholder') || '',
        href: el.getAttribute('href') || '',
        clickable: interactive,
        typeable: tag === 'input' || tag === 'textarea' || tag === 'select',
        selectable: tag === 'select',
        visible: true,
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }
      });
    }
  });

  // Extract main text content from body
  const mainContent = document.querySelector('main, [role="main"], article, .content, #content');
  const bodyText = extractText(mainContent || document.body).substring(0, 2000);

  var snapshot = {
    url: window.location.href,
    title: document.title,
    elements: elements.slice(0, 100), // limit for performance
    textContent: bodyText,
    scrollY: Math.round(window.scrollY),
    pageHeight: Math.round(document.documentElement.scrollHeight),
    viewportHeight: Math.round(window.innerHeight),
    timestamp: Date.now()
  };

  // Send to React Native
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'PAGE_SNAPSHOT',
      data: snapshot
    }));
  }

  return JSON.stringify(snapshot);
})();
