// VoiceNav DOM Extractor — injected into WebView to extract structured page snapshots
// Enhanced with semantic structure, page type detection, and shopping data extraction
const DOM_EXTRACTOR_SCRIPT = `
(function() {
  var INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'menuitem', 'tab', 'option', 'searchbox', 'spinbutton', 'slider', 'switch'];
  var HEADING_TAGS = ['h1','h2','h3','h4','h5','h6'];

  function getRole(el) {
    var role = el.getAttribute('role');
    if (role) return role;
    var tag = el.tagName.toLowerCase();
    if (tag === 'a') return 'link';
    if (tag === 'button') return 'button';
    if (tag === 'input') return el.type || 'textbox';
    if (tag === 'select') return 'combobox';
    if (tag === 'textarea') return 'textbox';
    if (HEADING_TAGS.indexOf(tag) >= 0) return 'heading';
    if (tag === 'p') return 'paragraph';
    if (tag === 'img') return 'image';
    if (tag === 'nav') return 'navigation';
    if (tag === 'main') return 'main';
    if (tag === 'form') return 'form';
    if (tag === 'table') return 'table';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (tag === 'li') return 'listitem';
    if (tag === 'label') return 'label';
    return 'generic';
  }

  function getLabel(el) {
    var ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    if (el.id) {
      var label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (label) return label.textContent.trim();
    }
    var parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    return el.getAttribute('title') || el.getAttribute('placeholder') || '';
  }

  function isVisible(el) {
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isInteractive(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    var role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES.indexOf(role) >= 0) return true;
    if (el.onclick || el.getAttribute('onclick')) return true;
    var tabIndex = el.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) >= 0) return true;
    return false;
  }

  function extractText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, iframe').forEach(function(s) { s.remove(); });
    return (clone.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 500);
  }

  function detectPageType() {
    var url = window.location.href.toLowerCase();
    var title = document.title.toLowerCase();
    var body = document.body.textContent.toLowerCase().substring(0, 3000);

    if (/amazon\\.com|ebay\\.com|walmart\\.com|shopify|etsy\\.com/i.test(url)) return 'shopping';
    if (/google\\.com\\/search|bing\\.com\\/search|duckduckgo\\.com/i.test(url)) return 'search_results';
    if (/youtube\\.com|vimeo\\.com|twitch\\.tv/i.test(url)) return 'video';
    if (/facebook\\.com|twitter\\.com|instagram\\.com|linkedin\\.com|reddit\\.com/i.test(url)) return 'social';
    if (/gmail\\.com|mail\\.google\\.com|outlook\\.com|yahoo\\.com\\/mail/i.test(url)) return 'email';
    if (/news|cnn\\.com|bbc\\.com|nytimes\\.com|reuters\\.com|washingtonpost\\.com/i.test(url)) return 'news';
    if (/wikipedia\\.org/i.test(url)) return 'reference';
    if (/github\\.com|gitlab\\.com|stackoverflow\\.com/i.test(url)) return 'developer';
    if (/login|sign.in|sign.up|register/i.test(title + ' ' + body.substring(0, 500))) return 'auth';
    if (document.querySelector('form[action*="checkout"], [class*="checkout"], #checkout')) return 'checkout';
    if (document.querySelector('[class*="product"], [itemtype*="Product"], [data-component-type="s-search-result"]')) return 'product_listing';
    return 'general';
  }

  function extractShoppingData() {
    var data = {};
    // Price extraction
    var priceEl = document.querySelector('[class*="price"], [data-asin-price], .a-price-whole, .offer-price, [itemprop="price"]');
    if (priceEl) data.price = priceEl.textContent.trim();
    // Rating
    var ratingEl = document.querySelector('[class*="rating"], [class*="stars"], [aria-label*="star"], [aria-label*="rating"]');
    if (ratingEl) data.rating = ratingEl.textContent.trim() || ratingEl.getAttribute('aria-label') || '';
    // Review count
    var reviewEl = document.querySelector('[class*="review-count"], [class*="ratings"], a[href*="reviews"]');
    if (reviewEl) data.reviewCount = reviewEl.textContent.trim();
    // Product name
    var nameEl = document.querySelector('#productTitle, [class*="product-title"], [class*="product-name"], h1[class*="title"]');
    if (nameEl) data.productName = nameEl.textContent.trim();
    // Cart button
    var cartBtn = document.querySelector('#add-to-cart-button, [class*="add-to-cart"], [class*="addtocart"], button[name*="cart"]');
    data.hasCartButton = !!cartBtn;
    return data;
  }

  function detectCommonPatterns() {
    var patterns = {};
    // Search bar
    patterns.hasSearch = !!document.querySelector('input[type="search"], [role="search"], input[name="q"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    // Login form
    patterns.hasLoginForm = !!document.querySelector('input[type="password"], form[action*="login" i], form[action*="signin" i]');
    // Navigation menu
    patterns.hasNav = !!document.querySelector('nav, [role="navigation"], [class*="nav-bar"], [class*="navbar"]');
    // Pagination
    patterns.hasPagination = !!document.querySelector('[class*="pagination"], [class*="pager"], nav[aria-label*="pagination" i]');
    // Infinite scroll indicator
    patterns.hasMoreContent = !!document.querySelector('[class*="load-more"], [class*="infinite"], [data-testid*="load"]');
    return patterns;
  }

  // Main extraction
  var idCounter = 0;
  var elements = [];
  var allElements = document.querySelectorAll('*');
  var headings = [];

  allElements.forEach(function(el) {
    if (!isVisible(el)) return;
    var role = getRole(el);
    var interactive = isInteractive(el);
    var tag = el.tagName.toLowerCase();

    if (interactive || role === 'heading' || role === 'paragraph' || role === 'navigation' || role === 'main' || role === 'form') {
      var elemId = ++idCounter;
      el.setAttribute('data-vn-id', elemId);
      var rect = el.getBoundingClientRect();

      var elem = {
        id: elemId,
        role: role,
        tag: tag,
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
      };
      elements.push(elem);

      if (role === 'heading' && elem.text) {
        headings.push({ level: parseInt(tag.replace('h','')) || 0, text: elem.text });
      }
    }
  });

  // Content extraction
  var mainContent = document.querySelector('main, [role="main"], article, .content, #content');
  var bodyText = extractText(mainContent || document.body).substring(0, 2000);

  var pageType = detectPageType();
  var shoppingData = (pageType === 'shopping' || pageType === 'product_listing') ? extractShoppingData() : null;
  var patterns = detectCommonPatterns();

  var snapshot = {
    url: window.location.href,
    title: document.title,
    elements: elements.slice(0, 100),
    textContent: bodyText,
    scrollY: Math.round(window.scrollY),
    pageHeight: Math.round(document.documentElement.scrollHeight),
    viewportHeight: Math.round(window.innerHeight),
    timestamp: Date.now(),
    pageType: pageType,
    headings: headings.slice(0, 20),
    shoppingData: shoppingData,
    patterns: patterns
  };

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SNAPSHOT', data: snapshot }));
  }

  return JSON.stringify(snapshot);
})();
`;

module.exports = DOM_EXTRACTOR_SCRIPT;
