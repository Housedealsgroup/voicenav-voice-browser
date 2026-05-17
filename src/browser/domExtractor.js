// VoiceNav DOM Extractor v4 — enhanced semantic extraction with relevance scoring
// Better element ranking, form field detection, dynamic content detection
const DOM_EXTRACTOR_SCRIPT = `
(function() {
  var INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'menuitem', 'tab', 'option', 'searchbox', 'spinbutton', 'slider', 'switch', 'treeitem', 'gridcell'];
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
    if (tag === 'video') return 'video';
    if (tag === 'audio') return 'audio';
    if (tag === 'details') return 'details';
    if (tag === 'dialog') return 'dialog';
    if (tag === 'iframe') return 'iframe';
    return 'generic';
  }

  function getLabel(el) {
    var ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    if (el.id) {
      try {
        var label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (label) return label.textContent.trim();
      } catch(e) {}
    }
    var parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    var ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      var labelEl = document.getElementById(ariaLabelledBy);
      if (labelEl) return labelEl.textContent.trim();
    }
    return el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('name') || '';
  }

  function isVisible(el) {
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
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
    if (el.getAttribute('href')) return true;
    // Check for cursor:pointer
    var style = window.getComputedStyle(el);
    if (style.cursor === 'pointer' && (el.textContent || '').trim().length > 0) return true;
    return false;
  }

  function isPrimaryAction(el) {
    var text = (el.textContent || '').toLowerCase().trim();
    var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    var combined = text + ' ' + ariaLabel;
    var primaryPatterns = ['add to cart', 'buy now', 'checkout', 'submit', 'sign in', 'log in', 'subscribe', 'apply now', 'get started', 'download', 'play', 'send', 'next', 'continue', 'confirm', 'accept', 'agree'];
    for (var i = 0; i < primaryPatterns.length; i++) {
      if (combined.indexOf(primaryPatterns[i]) >= 0) return true;
    }
    return false;
  }

  function getFormFieldType(el) {
    var tag = el.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return '';
    var type = (el.getAttribute('type') || '').toLowerCase();
    if (type) return type;
    var name = (el.getAttribute('name') || '').toLowerCase();
    var placeholder = (el.placeholder || '').toLowerCase();
    var combined = name + ' ' + placeholder;
    if (/email/.test(combined)) return 'email';
    if (/password|pwd/.test(combined)) return 'password';
    if (/phone|tel/.test(combined)) return 'tel';
    if (/search/.test(combined)) return 'search';
    if (/url|website/.test(combined)) return 'url';
    if (/date|birthday|dob/.test(combined)) return 'date';
    if (/number|qty|quantity|amount/.test(combined)) return 'number';
    return type || 'text';
  }

  function extractText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg, iframe, video, audio').forEach(function(s) { s.remove(); });
    return (clone.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 500);
  }

  function getRelevanceScore(el) {
    var score = 0;
    var tag = el.tagName.toLowerCase();
    var text = (el.textContent || '').trim();
    var role = el.getAttribute('role') || '';
    // Headings are high relevance
    if (HEADING_TAGS.indexOf(tag) >= 0) score += 50;
    // Primary actions
    if (isPrimaryAction(el)) score += 40;
    // Buttons and links
    if (tag === 'button' || role === 'button') score += 20;
    if (tag === 'a' && el.getAttribute('href')) score += 15;
    // Visible text length
    if (text.length > 0 && text.length < 100) score += 10;
    // ARIA labels
    if (el.getAttribute('aria-label')) score += 10;
    // Above the fold
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) score += 15;
    // Larger elements tend to be more important
    var area = rect.width * rect.height;
    if (area > 10000) score += 10;
    if (area > 50000) score += 10;
    return score;
  }

  function detectPageType() {
    var url = window.location.href.toLowerCase();
    var title = document.title.toLowerCase();
    var body = (document.body.textContent || '').toLowerCase().substring(0, 3000);
    var metaDesc = (document.querySelector('meta[name="description"]') || {}).content || '';

    if (/amazon\\.com|ebay\\.com|walmart\\.com|shopify|etsy\\.com|aliexpress|wish\\.com|target\\.com|bestbuy\\.com/i.test(url)) return 'shopping';
    if (/google\\.com\\/search|bing\\.com\\/search|duckduckgo\\.com|yahoo\\.com\\/search/i.test(url)) return 'search_results';
    if (/youtube\\.com|vimeo\\.com|twitch\\.tv|dailymotion/i.test(url)) return 'video';
    if (/facebook\\.com|twitter\\.com|instagram\\.com|linkedin\\.com|reddit\\.com|tiktok\\.com|pinterest\\.com/i.test(url)) return 'social';
    if (/gmail\\.com|mail\\.google\\.com|outlook\\.com|yahoo\\.com\\/mail|protonmail/i.test(url)) return 'email';
    if (/news|cnn\\.com|bbc\\.com|nytimes\\.com|reuters\\.com|washingtonpost\\.com|theguardian|aljazeera|apnews/i.test(url)) return 'news';
    if (/wikipedia\\.org/i.test(url)) return 'reference';
    if (/github\\.com|gitlab\\.com|stackoverflow\\.com|dev\\.to|medium\\.com/i.test(url)) return 'developer';
    if (/docs\\.google\\.com|notion\\.so|confluence|wiki/i.test(url)) return 'documentation';
    if (/maps\\.google|openstreetmap|waze/i.test(url)) return 'maps';
    if (/spotify|soundcloud|apple\\.com\\/music|music\\.youtube/i.test(url)) return 'music';
    if (/podcast|anchor\\.fm|podbean/i.test(url)) return 'podcast';
    if (/bank|chase\\.com|wellsfargo|paypal|venmo|cashapp/i.test(url)) return 'banking';
    if (/booking\\.com|airbnb|expedia|hotels\\.com|tripadvisor/i.test(url)) return 'travel';
    if (/doordash|ubereats|grubhub|instacart|postmates/i.test(url)) return 'food';
    if (/webmd|mayo|healthline|nih\\.gov|who\\.int/i.test(url)) return 'health';
    if (/coursera|udemy|edx|khan|duolingo|\.edu/i.test(url)) return 'education';
    if (/\.gov|gov\\.uk|europa\\.eu/i.test(url)) return 'government';
    if (/forum|discourse|quora|stackexchange/i.test(url)) return 'forum';
    if (/blog|medium|substack|wordpress|ghost\\.io/i.test(url)) return 'blog';
    if (/login|sign.in|sign.up|register|create.account/i.test(title + ' ' + body.substring(0, 500))) return 'auth';
    if (document.querySelector('form[action*="checkout"], [class*="checkout"], #checkout, [data-testid*="checkout"]')) return 'checkout';
    if (document.querySelector('[class*="product"], [itemtype*="Product"], [data-component-type="s-search-result"], [data-testid*="product"]')) return 'product_listing';
    return 'general';
  }

  function extractShoppingData() {
    var data = {};
    // Price extraction with multiple selectors
    var priceSelectors = [
      '[class*="price"]', '[data-asin-price]', '.a-price-whole', '.offer-price',
      '[itemprop="price"]', '[data-testid*="price"]', '.price', '.product-price',
      '[class*="Price"]', '[class*="cost"]', '[class*="amount"]',
      'meta[property="product:price:amount"]'
    ];
    for (var i = 0; i < priceSelectors.length; i++) {
      var priceEl = document.querySelector(priceSelectors[i]);
      if (priceEl) {
        data.price = (priceEl.content || priceEl.textContent || '').trim();
        if (data.price) break;
      }
    }
    // Rating
    var ratingSelectors = ['[class*="rating"]', '[class*="stars"]', '[aria-label*="star"]', '[aria-label*="rating"]', '[itemprop="ratingValue"]', '[data-testid*="rating"]'];
    for (var i = 0; i < ratingSelectors.length; i++) {
      var ratingEl = document.querySelector(ratingSelectors[i]);
      if (ratingEl) {
        data.rating = ratingEl.textContent.trim() || ratingEl.getAttribute('aria-label') || ratingEl.getAttribute('content') || '';
        if (data.rating) break;
      }
    }
    // Review count
    var reviewSelectors = ['[class*="review-count"]', '[class*="ratings"]', 'a[href*="reviews"]', '[itemprop="reviewCount"]', '[data-testid*="review"]'];
    for (var i = 0; i < reviewSelectors.length; i++) {
      var reviewEl = document.querySelector(reviewSelectors[i]);
      if (reviewEl) {
        data.reviewCount = reviewEl.textContent.trim();
        if (data.reviewCount) break;
      }
    }
    // Product name
    var nameSelectors = ['#productTitle', '[class*="product-title"]', '[class*="product-name"]', 'h1[class*="title"]', '[itemprop="name"]', '[data-testid*="product-title"]'];
    for (var i = 0; i < nameSelectors.length; i++) {
      var nameEl = document.querySelector(nameSelectors[i]);
      if (nameEl) {
        data.productName = nameEl.textContent.trim();
        if (data.productName) break;
      }
    }
    // Brand
    var brandEl = document.querySelector('[class*="brand"], [itemprop="brand"], #bylineInfo, [data-testid*="brand"]');
    if (brandEl) data.brand = brandEl.textContent.trim();
    // Availability
    var availEl = document.querySelector('[class*="availability"], [class*="in-stock"], #availability, [data-testid*="availability"]');
    if (availEl) data.availability = availEl.textContent.trim();
    // Shipping
    var shipEl = document.querySelector('[class*="shipping"], [class*="delivery"], [data-testid*="delivery"]');
    if (shipEl) data.shipping = shipEl.textContent.trim();
    // Cart button
    var cartSelectors = ['#add-to-cart-button', '[class*="add-to-cart"]', '[class*="addtocart"]', 'button[name*="cart"]', '[data-testid*="cart"]', '[aria-label*="cart"]'];
    data.hasCartButton = false;
    for (var i = 0; i < cartSelectors.length; i++) {
      if (document.querySelector(cartSelectors[i])) { data.hasCartButton = true; break; }
    }
    return data;
  }

  function detectCommonPatterns() {
    var patterns = {};
    patterns.hasSearch = !!document.querySelector('input[type="search"], [role="search"], input[name="q"], input[placeholder*="search" i], input[placeholder*="Search" i], form[action*="search"]');
    patterns.hasLoginForm = !!document.querySelector('input[type="password"], form[action*="login" i], form[action*="signin" i], [class*="login-form"]');
    patterns.hasNav = !!document.querySelector('nav, [role="navigation"], [class*="nav-bar"], [class*="navbar"], [class*="main-nav"]');
    patterns.hasPagination = !!document.querySelector('[class*="pagination"], [class*="pager"], nav[aria-label*="pagination" i], [class*="next-page"]');
    patterns.hasMoreContent = !!document.querySelector('[class*="load-more"], [class*="infinite"], [data-testid*="load"]');
    patterns.hasInfiniteScroll = !!document.querySelector('[class*="infinite-scroll"], [data-testid*="infinite"], [class*="lazy-load"]');
    patterns.hasModal = !!document.querySelector('[role="dialog"], [class*="modal"], [class*="popup"], dialog');
    patterns.hasVideo = !!document.querySelector('video, [class*="video-player"], iframe[src*="youtube"], iframe[src*="vimeo"], [data-testid*="video"]');
    patterns.hasAudio = !!document.querySelector('audio, [class*="audio-player"], [data-testid*="audio"]');
    patterns.hasTable = !!document.querySelector('table, [role="grid"]');
    patterns.hasTabs = !!document.querySelector('[role="tablist"], [class*="tabs"]');
    patterns.hasAccordion = !!document.querySelector('details, [class*="accordion"], [class*="collapsible"]');
    patterns.hasBreadcrumbs = !!document.querySelector('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]');
    return patterns;
  }

  function extractMetadata() {
    var meta = {};
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) meta.description = descEl.content || '';
    var canonEl = document.querySelector('link[rel="canonical"]');
    if (canonEl) meta.canonicalUrl = canonEl.href || '';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogTitle || ogDesc || ogImage) {
      meta.openGraph = {};
      if (ogTitle) meta.openGraph.title = ogTitle.content || '';
      if (ogDesc) meta.openGraph.description = ogDesc.content || '';
      if (ogImage) meta.openGraph.image = ogImage.content || '';
    }
    var langEl = document.documentElement;
    if (langEl) meta.language = langEl.getAttribute('lang') || '';
    return meta;
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

    if (interactive || role === 'heading' || role === 'paragraph' || role === 'navigation' || role === 'main' || role === 'form' || role === 'video' || role === 'audio') {
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
        },
        relevanceScore: getRelevanceScore(el),
        ariaLevel: HEADING_TAGS.indexOf(tag) >= 0 ? parseInt(tag.replace('h','')) || 0 : undefined,
        formFieldType: getFormFieldType(el),
        isPrimaryAction: isPrimaryAction(el)
      };
      elements.push(elem);

      if (role === 'heading' && elem.text) {
        headings.push({ level: parseInt(tag.replace('h','')) || 0, text: elem.text });
      }
    }
  });

  // Sort elements by relevance
  elements.sort(function(a, b) { return (b.relevanceScore || 0) - (a.relevanceScore || 0); });

  // Content extraction
  var mainContent = document.querySelector('main, [role="main"], article, .content, #content, [class*="main-content"]');
  var bodyText = extractText(mainContent || document.body).substring(0, 2000);

  var pageType = detectPageType();
  var shoppingData = (pageType === 'shopping' || pageType === 'product_listing') ? extractShoppingData() : null;
  var patterns = detectCommonPatterns();
  var meta = extractMetadata();

  var snapshot = {
    url: window.location.href,
    title: document.title,
    elements: elements.slice(0, 150),
    textContent: bodyText,
    scrollY: Math.round(window.scrollY),
    pageHeight: Math.round(document.documentElement.scrollHeight),
    viewportHeight: Math.round(window.innerHeight),
    timestamp: Date.now(),
    pageType: pageType,
    headings: headings.slice(0, 30),
    shoppingData: shoppingData,
    patterns: patterns,
    language: meta.language,
    metaDescription: meta.description,
    canonicalUrl: meta.canonicalUrl,
    openGraph: meta.openGraph
  };

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SNAPSHOT', data: snapshot }));
  }

  return JSON.stringify(snapshot);
})();
`;

module.exports = DOM_EXTRACTOR_SCRIPT;
