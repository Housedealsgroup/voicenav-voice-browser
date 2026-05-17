import { decideAction, getPageSuggestions, analyzePage } from '../brain';
import type { PageSnapshot, VoiceCommand, AgentContext, PageElement } from '../../browser/types';

const mockElement: PageElement = {
  id: 1, role: 'button', tag: 'button', text: 'Sign In', label: 'Sign In',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const mockSnapshot: PageSnapshot = {
  url: 'https://example.com', title: 'Example', elements: [mockElement],
  textContent: 'Welcome to Example', scrollY: 0, pageHeight: 1000,
  viewportHeight: 800, timestamp: Date.now(), pageType: 'general',
};

const mockContext: AgentContext = {
  stepHistory: [], retryCount: 0,
};

// Helper to make snapshots with specific elements
function makeSnapshot(overrides: Partial<PageSnapshot> = {}, extraElements: PageElement[] = []): PageSnapshot {
  const baseElements = overrides.elements !== undefined ? overrides.elements : mockSnapshot.elements;
  return {
    ...mockSnapshot,
    ...overrides,
    elements: [...baseElements, ...extraElements],
  };
}

const searchBox: PageElement = {
  id: 10, role: 'textbox', tag: 'input', text: '', label: 'Search',
  placeholder: 'Search...', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 200, height: 40 },
};

const playButton: PageElement = {
  id: 20, role: 'button', tag: 'button', text: 'Play', label: 'Play',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const pauseButton: PageElement = {
  id: 21, role: 'button', tag: 'button', text: 'Pause', label: 'Pause',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const nextButton: PageElement = {
  id: 22, role: 'button', tag: 'button', text: 'Next', label: 'Next',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const prevButton: PageElement = {
  id: 23, role: 'button', tag: 'button', text: 'Previous', label: 'Previous',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const cartButton: PageElement = {
  id: 30, role: 'button', tag: 'button', text: 'Add to Cart', label: 'Add to Cart',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 120, height: 40 },
};

const checkoutButton: PageElement = {
  id: 31, role: 'button', tag: 'button', text: 'Checkout', label: 'Checkout',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 120, height: 40 },
};

const sortButton: PageElement = {
  id: 40, role: 'button', tag: 'button', text: 'Sort by Price', label: 'Sort by Price',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 120, height: 40 },
};

const filterButton: PageElement = {
  id: 41, role: 'button', tag: 'button', text: 'Filter', label: 'Filter',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const signInButton: PageElement = {
  id: 50, role: 'button', tag: 'button', text: 'Sign In', label: 'Sign In',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const signUpButton: PageElement = {
  id: 51, role: 'button', tag: 'button', text: 'Sign Up', label: 'Sign Up',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const submitButton: PageElement = {
  id: 52, role: 'button', tag: 'button', text: 'Submit', label: 'Submit',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const sendButton: PageElement = {
  id: 53, role: 'button', tag: 'button', text: 'Send', label: 'Send',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const deleteButton: PageElement = {
  id: 54, role: 'button', tag: 'button', text: 'Delete', label: 'Delete',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const shareButton: PageElement = {
  id: 55, role: 'button', tag: 'button', text: 'Share', label: 'Share',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 80, height: 40 },
};

const downloadButton: PageElement = {
  id: 56, role: 'button', tag: 'button', text: 'Download', label: 'Download',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const composeButton: PageElement = {
  id: 57, role: 'button', tag: 'button', text: 'Compose', label: 'Compose',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

const passwordField: PageElement = {
  id: 60, role: 'textbox', tag: 'input', text: '', label: 'Password',
  placeholder: 'Password', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 200, height: 40 },
  formFieldType: 'password',
};

const nameInput: PageElement = {
  id: 61, role: 'textbox', tag: 'input', text: '', label: 'Name',
  placeholder: 'Enter name', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 200, height: 40 },
};

const link: PageElement = {
  id: 70, role: 'link', tag: 'a', text: 'About Us', label: 'About Us',
  placeholder: '', href: 'https://example.com/about', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 30 },
};

const dropdown: PageElement = {
  id: 80, role: 'combobox', tag: 'select', text: 'Category', label: 'Category',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: true,
  visible: true, rect: { top: 0, left: 0, width: 150, height: 40 },
};

const buyNowButton: PageElement = {
  id: 32, role: 'button', tag: 'button', text: 'Buy Now', label: 'Buy Now',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 100, height: 40 },
};

describe('Brain Decision Engine', () => {
  describe('decideAction() — Navigation intents', () => {
    it('returns navigate action for navigate intent', () => {
      const intent: VoiceCommand = { intent: 'navigate', target: 'amazon.com', confidence: 0.9 };
      const { action, needsRetry } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
      expect(needsRetry).toBe(false);
    });

    it('returns navigate action for open intent with target', () => {
      const intent: VoiceCommand = { intent: 'open', target: 'google.com', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
    });

    it('returns speak for open intent without target', () => {
      const intent: VoiceCommand = { intent: 'open', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns back action for back intent', () => {
      const intent: VoiceCommand = { intent: 'back', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('back');
    });

    it('returns forward action for forward intent', () => {
      const intent: VoiceCommand = { intent: 'forward', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('forward');
    });

    it('returns refresh action for refresh intent', () => {
      const intent: VoiceCommand = { intent: 'refresh', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('refresh');
    });

    it('returns navigate to google for home intent', () => {
      const intent: VoiceCommand = { intent: 'home', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
    });

    it('returns navigate action for search intent without search box', () => {
      const intent: VoiceCommand = { intent: 'search', target: 'headphones', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
    });

    it('returns type action for search intent with search box', () => {
      const snapshot = makeSnapshot({}, [searchBox]);
      const intent: VoiceCommand = { intent: 'search', target: 'headphones', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('type');
    });

    it('returns navigate for compare intent', () => {
      const intent: VoiceCommand = { intent: 'compare', target: 'laptop', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
    });
  });

  describe('decideAction() — Scroll & movement intents', () => {
    it('returns scroll action for scroll intent', () => {
      const intent: VoiceCommand = { intent: 'scroll', target: 'down', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
    });

    it('returns click for next intent when button exists', () => {
      const snapshot = makeSnapshot({}, [nextButton]);
      const intent: VoiceCommand = { intent: 'next', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns scroll for next intent without button', () => {
      const intent: VoiceCommand = { intent: 'next', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
    });

    it('returns click for previous intent when button exists', () => {
      const snapshot = makeSnapshot({}, [prevButton]);
      const intent: VoiceCommand = { intent: 'previous', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns scroll for previous intent without button', () => {
      const intent: VoiceCommand = { intent: 'previous', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
    });
  });

  describe('decideAction() — Read & content intents', () => {
    it('returns read action for read intent', () => {
      const intent: VoiceCommand = { intent: 'read', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns keypress for find intent', () => {
      const intent: VoiceCommand = { intent: 'find', target: 'keyword', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('keypress');
    });

    it('returns speak for bookmark intent', () => {
      const intent: VoiceCommand = { intent: 'bookmark', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns speak for copy intent', () => {
      const intent: VoiceCommand = { intent: 'copy', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns speak for zoom intent', () => {
      const intent: VoiceCommand = { intent: 'zoom', target: 'in', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns speak for help intent', () => {
      const intent: VoiceCommand = { intent: 'help', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('decideAction() — Shopping intents', () => {
    it('returns click for cart intent when button exists', () => {
      const snapshot = makeSnapshot({}, [cartButton]);
      const intent: VoiceCommand = { intent: 'cart', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns scroll for cart intent on first retry', () => {
      const intent: VoiceCommand = { intent: 'cart', confidence: 0.9 };
      const { action, needsRetry } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
      expect(needsRetry).toBe(true);
    });

    it('returns click for buy intent when cart button exists', () => {
      const snapshot = makeSnapshot({}, [cartButton]);
      const intent: VoiceCommand = { intent: 'buy', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns click for buy intent when checkout button exists', () => {
      const snapshot = makeSnapshot({}, [buyNowButton]);
      const intent: VoiceCommand = { intent: 'buy', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for buy intent when no buttons found', () => {
      const intent: VoiceCommand = { intent: 'buy', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for checkout intent when button exists', () => {
      const snapshot = makeSnapshot({}, [checkoutButton]);
      const intent: VoiceCommand = { intent: 'checkout', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for checkout intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'checkout', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for sort intent when button exists', () => {
      const snapshot = makeSnapshot({}, [sortButton]);
      const intent: VoiceCommand = { intent: 'sort', target: 'price', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for sort intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'sort', target: 'price', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for filter intent when button exists', () => {
      const snapshot = makeSnapshot({}, [filterButton]);
      const intent: VoiceCommand = { intent: 'filter', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for filter intent when no button found', () => {
      const emptySnapshot = makeSnapshot({ elements: [] });
      const intent: VoiceCommand = { intent: 'filter', confidence: 0.9 };
      const { action } = decideAction(intent, emptySnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('decideAction() — Form & auth intents', () => {
    it('returns click for login intent when sign in button exists', () => {
      const snapshot = makeSnapshot({}, [signInButton]);
      const intent: VoiceCommand = { intent: 'login', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns focus for login intent when password field exists', () => {
      const snapshot = makeSnapshot({ elements: [] }, [passwordField]);
      const intent: VoiceCommand = { intent: 'login', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('focus');
    });

    it('returns speak for login intent when nothing found', () => {
      const emptySnapshot = makeSnapshot({ elements: [] });
      const intent: VoiceCommand = { intent: 'login', confidence: 0.9 };
      const { action } = decideAction(intent, emptySnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for signup intent when button exists', () => {
      const snapshot = makeSnapshot({}, [signUpButton]);
      const intent: VoiceCommand = { intent: 'signup', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for signup intent when no button found', () => {
      const emptySnapshot = makeSnapshot({ elements: [] });
      const intent: VoiceCommand = { intent: 'signup', confidence: 0.9 };
      const { action } = decideAction(intent, emptySnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns type for type intent when input exists', () => {
      const snapshot = makeSnapshot({}, [nameInput]);
      const intent: VoiceCommand = { intent: 'type', target: 'name', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('type');
    });

    it('returns speak for type intent when no input found', () => {
      const intent: VoiceCommand = { intent: 'type', target: 'John', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for submit intent when button exists', () => {
      const snapshot = makeSnapshot({}, [submitButton]);
      const intent: VoiceCommand = { intent: 'submit', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for submit intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'submit', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for form submit target', () => {
      const snapshot = makeSnapshot({}, [submitButton]);
      const intent: VoiceCommand = { intent: 'form', target: 'submit', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns type for form intent with input field', () => {
      const snapshot = makeSnapshot({}, [nameInput]);
      const intent: VoiceCommand = { intent: 'form', target: 'name', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('type');
    });

    it('returns speak for form intent when no field found', () => {
      const intent: VoiceCommand = { intent: 'form', target: 'email', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns select for select intent when element exists', () => {
      const snapshot = makeSnapshot({}, [dropdown]);
      const intent: VoiceCommand = { intent: 'select', target: 'Category', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('select');
    });

    it('returns speak for select intent when no element found', () => {
      const intent: VoiceCommand = { intent: 'select', target: 'Category', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('decideAction() — Media intents', () => {
    it('returns click for play intent when button exists', () => {
      const snapshot = makeSnapshot({}, [playButton]);
      const intent: VoiceCommand = { intent: 'play', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for play intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'play', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for pause intent when button exists', () => {
      const snapshot = makeSnapshot({}, [pauseButton]);
      const intent: VoiceCommand = { intent: 'pause', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for pause intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'pause', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('decideAction() — Action intents', () => {
    it('returns click for share intent when button exists', () => {
      const snapshot = makeSnapshot({}, [shareButton]);
      const intent: VoiceCommand = { intent: 'share', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for share intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'share', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for download intent when button exists', () => {
      const snapshot = makeSnapshot({}, [downloadButton]);
      const intent: VoiceCommand = { intent: 'download', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for download intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'download', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for compose intent when button exists', () => {
      const snapshot = makeSnapshot({}, [composeButton]);
      const intent: VoiceCommand = { intent: 'compose', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for compose intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'compose', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for send intent when button exists', () => {
      const snapshot = makeSnapshot({}, [sendButton]);
      const intent: VoiceCommand = { intent: 'send', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for send intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'send', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns click for delete intent when button exists', () => {
      const snapshot = makeSnapshot({}, [deleteButton]);
      const intent: VoiceCommand = { intent: 'delete', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns speak for delete intent when no button found', () => {
      const intent: VoiceCommand = { intent: 'delete', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns done for stop intent', () => {
      const intent: VoiceCommand = { intent: 'stop', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('done');
    });
  });

  describe('decideAction() — Tab intents', () => {
    it('returns speak for tab_new intent', () => {
      const intent: VoiceCommand = { intent: 'tab_new', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns speak for tab_close intent', () => {
      const intent: VoiceCommand = { intent: 'tab_close', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('decideAction() — Click intent', () => {
    it('returns click for button by name', () => {
      const snapshot = makeSnapshot({}, [signInButton]);
      const intent: VoiceCommand = { intent: 'click', target: 'Sign In', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns click for link by name', () => {
      const snapshot = makeSnapshot({}, [link]);
      const intent: VoiceCommand = { intent: 'click', target: 'About Us', confidence: 0.9 };
      const { action } = decideAction(intent, snapshot, mockContext);
      expect(action.action).toBe('click');
    });

    it('returns scroll for click intent on first retry', () => {
      const intent: VoiceCommand = { intent: 'click', target: 'nonexistent', confidence: 0.9 };
      const { action, needsRetry } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
      expect(needsRetry).toBe(true);
    });

    it('returns navigate for click intent after retry', () => {
      const context: AgentContext = { stepHistory: ['scroll'], retryCount: 1 };
      const intent: VoiceCommand = { intent: 'click', target: 'nonexistent', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, context);
      expect(action.action).toBe('navigate');
    });
  });

  describe('decideAction() — Default fallback', () => {
    it('returns speak for unknown intent', () => {
      const intent: VoiceCommand = { intent: 'unknown_intent' as any, confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });
  });

  describe('getPageSuggestions()', () => {
    it('returns suggestions for shopping pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'shopping' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for search pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'search_results' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns default suggestions for unknown pages', () => {
      const suggestions = getPageSuggestions(mockSnapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for auth pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'auth' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for news pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'news' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for email pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'email' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for video pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'video' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('analyzePage()', () => {
    it('returns descriptive string', () => {
      const analysis = analyzePage(mockSnapshot);
      expect(typeof analysis).toBe('string');
      expect(analysis.length).toBeGreaterThan(0);
    });

    it('includes page type when not general', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'shopping' };
      const analysis = analyzePage(snapshot);
      expect(analysis).toContain('shopping');
    });

    it('includes shopping data when present', () => {
      const snapshot: PageSnapshot = {
        ...mockSnapshot,
        shoppingData: { productName: 'Headphones', price: '$29.99', rating: '4.5', reviewCount: '100', brand: 'Sony' },
      };
      const analysis = analyzePage(snapshot);
      expect(analysis).toContain('Headphones');
      expect(analysis).toContain('$29.99');
    });
  });
});
