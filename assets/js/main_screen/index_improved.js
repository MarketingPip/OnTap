/**
 * WhatsOnTap Application
 * Improved version with better architecture and error handling
 */

// ============================================================================
// Constants and Configuration
// ============================================================================

const CONFIG = {
  VERSION: '1.0.0',
  REDIRECT_DELAY: 2000,
  ESCAPE_KEY_THRESHOLD: 500,
  RESOURCE_TIMEOUT: 5000,
  PATHS: {
    EDITOR: 'pages/editor.html',
    TEMPLATES: './templates.txt'
  }
};

const KEYCODES = {
  ESCAPE: 27
};

// ============================================================================
// State Management
// ============================================================================

class AppState {
  constructor() {
    this.templateOptions = [];
    this.beerMenu = null;
    this.storedScripts = [];
    this.storedStylesheets = [];
    this.isSlideOpen = false;
    this.lastEscapePress = 0;
  }

  setBeerMenu(menu) {
    this.beerMenu = menu;
  }

  getBeerMenu() {
    return this.beerMenu;
  }

  setTemplateOptions(options) {
    this.templateOptions = options;
  }

  getTemplateOptions() {
    return this.templateOptions;
  }

  addScript(script) {
    this.storedScripts.push(script);
  }

  addStylesheet(stylesheet) {
    this.storedStylesheets.push(stylesheet);
  }

  clearResources() {
    this.storedScripts = [];
    this.storedStylesheets = [];
  }
}

const appState = new AppState();

// ============================================================================
// Utility Functions
// ============================================================================

const Utils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  parseUrlQuery: () => {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  },

  getLocalizedTime: () => {
    const userLocale = navigator.language || 'en-US';
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date().toLocaleTimeString(userLocale, options);
  },

  getBaseUrl: () => {
    const currentLocation = window.location.href.split('?')[0];
    return currentLocation.replace('index.html', '');
  },

  sanitizeHtml: (html) => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }
};

// ============================================================================
// DOM Manipulation Helpers
// ============================================================================

const DOM = {
  getElement: (selector) => document.querySelector(selector),
  
  getAllElements: (selector) => document.querySelectorAll(selector),

  createElement: (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('on')) {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });

    return element;
  },

  show: (element) => {
    if (typeof element === 'string') element = DOM.getElement(element);
    element?.classList.remove('hidden', 'hide-display');
  },

  hide: (element) => {
    if (typeof element === 'string') element = DOM.getElement(element);
    element?.classList.add('hidden');
  },

  toggleClass: (element, className) => {
    if (typeof element === 'string') element = DOM.getElement(element);
    element?.classList.toggle(className);
  }
};

// ============================================================================
// Modal Management
// ============================================================================

class ModalManager {
  constructor() {
    this.modal = DOM.getElement('#myModal');
    this.titleElement = DOM.getElement('#modalTitle');
    this.contentElement = DOM.getElement('#modalContent');
    this.closeButton = DOM.getElement('#closeModal');
    this.currentCloseHandler = null;
  }

  open(title, content, showCloseButton = true) {
    if (!this.modal) return;

    this.titleElement.textContent = title;
    this.contentElement.innerHTML = content;
    this.modal.style.display = 'block';

    // Handle close button visibility
    if (showCloseButton) {
      this.closeButton.classList.remove('hidden');
      this.attachCloseHandler();
    } else {
      this.closeButton.classList.add('hidden');
    }

    window.hideOverlay?.();
  }

  close() {
    if (!this.modal) return;
    
    this.modal.style.display = 'none';
    this.detachCloseHandler();
    window.showOverlay?.();
  }

  attachCloseHandler() {
    this.currentCloseHandler = () => this.close();
    this.closeButton.addEventListener('click', this.currentCloseHandler);
  }

  detachCloseHandler() {
    if (this.currentCloseHandler) {
      this.closeButton.removeEventListener('click', this.currentCloseHandler);
      this.currentCloseHandler = null;
    }
  }
}

const modalManager = new ModalManager();
window.hideModal = () => modalManager.close();
window.openModal = (...args) => modalManager.open(...args);
// ============================================================================
// Template Management
// ============================================================================

class TemplateManager {
  static async fetchTemplates() {
    try {
      const response = await fetch(CONFIG.PATHS.TEMPLATES);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates. Status: ${response.status}`);
      }

      const fileContent = await response.text();
      return fileContent
        .split('\n')
        .map(option => option.trim())
        .filter(Boolean);
    } catch (error) {
      throw new Error(`Error fetching templates: ${error.message}`);
    }
  }

  static generateSelectHTML() {
    const select = DOM.createElement('select', {
      id: 'templateSelect',
      className: 'w-full border border-gray-300 p-2 rounded-md mb-4'
    });

    // Default option
    select.appendChild(DOM.createElement('option', {
      value: 'default',
      innerHTML: 'Default Template'
    }));

    // Template options
    appState.getTemplateOptions().forEach(template => {
      select.appendChild(DOM.createElement('option', {
        value: template,
        innerHTML: `Template ${template}`
      }));
    });

    return select.outerHTML;
  }

  static async loadTemplate(templateName) {
    const errorElement = DOM.getElement('#templateError');
    errorElement?.classList.add('hidden');

    try {
      const response = await fetch(`./${templateName}.html`);

      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateName}. Status: ${response.status}`);
      }

      const htmlContent = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // Validate version
      const versionElement = tempDiv.querySelector('version-number');
      if (!versionElement) {
        throw new Error('Version number not found in template.');
      }

      const versionNumber = versionElement.textContent.trim();
      if (versionNumber !== CONFIG.VERSION) {
        throw new Error(`Invalid version: ${versionNumber}. Expected: ${CONFIG.VERSION}`);
      }

      versionElement.remove();

      // Extract and store scripts
      tempDiv.querySelectorAll('script').forEach(script => {
        const scriptInfo = {
          type: script.type,
          isModule: script.type === 'module'
        };

        if (script.src) {
          scriptInfo.src = script.src;
        } else {
          scriptInfo.content = script.text;
        }

        appState.addScript(scriptInfo);
        script.remove();
      });

      // Extract and store stylesheets
      tempDiv.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        appState.addStylesheet(link.href);
        link.remove();
      });

      return tempDiv.innerHTML;

    } catch (error) {
      if (errorElement) {
        errorElement.classList.remove('hidden');
        errorElement.textContent = error.message;
      }
      throw error;
    }
  }
}

// ============================================================================
// Resource Loading
// ============================================================================

class ResourceLoader {
  static loadResource(resourceInfo, resourceType) {
    return new Promise((resolve, reject) => {
      const { content, src, type, isModule } = resourceInfo;
      let element;

      if (resourceType === 'script') {
        element = document.createElement('script');
        if (src) {
          element.src = src;
        } else {
          element.text = content;
          document.head.appendChild(element);
          resolve();
          return;
        }
        if (type) element.type = type;
        if (isModule) element.type = 'module';
      } else if (resourceType === 'stylesheet') {
        element = document.createElement('link');
        element.rel = 'stylesheet';
        element.href = resourceInfo;
      } else {
        reject(new Error('Invalid resource type'));
        return;
      }

      const cleanup = () => {
        clearTimeout(timeoutId);
        element.onload = null;
        element.onerror = null;
      };

      element.onload = () => {
        cleanup();
        resolve();
      };

      element.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load ${resourceType}: ${src || resourceInfo}`));
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout loading ${resourceType}: ${src || resourceInfo}`));
      }, CONFIG.RESOURCE_TIMEOUT);

      document.head.appendChild(element);
    });
  }

  static async loadAllResources() {
    const scriptPromises = appState.storedScripts.map(
      script => this.loadResource(script, 'script')
    );
    const stylesheetPromises = appState.storedStylesheets.map(
      stylesheet => this.loadResource(stylesheet, 'stylesheet')
    );

    try {
      await Promise.all([...scriptPromises, ...stylesheetPromises]);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  }
}

// ============================================================================
// Menu Validation
// ============================================================================

class MenuValidator {
  static validate(menuData) {
    const errors = [];

    if (!menuData.programName || menuData.programName !== 'BeerKiosk') {
      errors.push('Invalid program name');
    }

    if (!menuData.kioskMenu) {
      errors.push('Missing kioskMenu data');
    }

    if (!menuData.kioskMenu?.beers || menuData.kioskMenu.beers.length === 0) {
      errors.push('No items in menu');
    }

    const versionValidation = window.validateVersion?.(menuData.version);
    if (versionValidation?.error) {
      errors.push(versionValidation.error);
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }
}

// ============================================================================
// Menu Import/Export
// ============================================================================

class MenuManager {
  static async importMenu(file, templateName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          MenuValidator.validate(importedData);
          
          appState.setBeerMenu(importedData);
          
          const template = await TemplateManager.loadTemplate(templateName);
          await this.renderMenu(template);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  static async renderMenu(menuTemplate) {
    try {
      const displayMenu = DOM.getElement('.display-menu');
      const beerMenu = appState.getBeerMenu();

      if (!displayMenu || !beerMenu) {
        throw new Error('Missing required elements');
      }

      // Render template with mustache
      displayMenu.innerHTML = window.mustache.render(menuTemplate, beerMenu.kioskMenu).trim();

      // Load resources
      await ResourceLoader.loadAllResources();

      // Show menu with animation
      await this.showMenuWithAnimation(displayMenu);

      // Setup menu features
      this.setupMenuFeatures();

      // Hide main menu
      DOM.hide('.main-menu');

    } catch (error) {
      console.error('Error rendering menu:', error);
      throw error;
    }
  }

  static async showMenuWithAnimation(displayMenu) {
    displayMenu.classList.remove('hidden');
    await Utils.delay(100);
    displayMenu.classList.remove('hide-display');
    displayMenu.style.opacity = '1';
    displayMenu.classList.add('show-display');

    // Request fullscreen
    try {
      await displayMenu.requestFullscreen();
    } catch (error) {
      console.log('Fullscreen not available:', error.message);
    }
  }

  static setupMenuFeatures() {
    KeyboardHandler.registerEscapeHandler();
    MenuOptionsRenderer.render();
  }
}

// ============================================================================
// Menu Options Renderer
// ============================================================================

class MenuOptionsRenderer {
  static render() {
    const beerMenu = appState.getBeerMenu();
    if (!beerMenu) return;

    this.renderTitle(beerMenu);
    this.renderMarquee(beerMenu);
  }

  static renderTitle(beerMenu) {
    const titleElement = DOM.getElement('#MenuTitle');
    if (!titleElement) return;

    const { titleEnabled } = beerMenu.options;
    const { title } = beerMenu.kioskMenu;

    if (!titleEnabled || !title) {
      titleElement.style.display = 'none';
    } else {
      titleElement.textContent = title;
    }
  }

  static renderMarquee(beerMenu) {
    const { marqueeEnabled, marqueeSettings } = beerMenu.options;
    
    if (!marqueeEnabled) {
      this.hideMarquee();
      return;
    }

    const { strings = [], clock } = marqueeSettings;

    if (strings.length === 0 && !clock) {
      this.hideMarquee();
      return;
    }

    // Add strings to marquee
    strings.forEach(str => this.addMarqueeItem(str));

    // Add clock if enabled
    if (clock) {
      this.addMarqueeItem('', 'clockMarquee');
      this.startClock();
    }
  }

  static addMarqueeItem(text, id = null) {
    const marquee = DOM.getElement('.marquee');
    if (!marquee) return;

    const span = DOM.createElement('span', { innerHTML: text });
    if (id) span.id = id;
    marquee.appendChild(span);
  }

  static startClock() {
    const updateClock = () => {
      const clockElement = DOM.getElement('#clockMarquee');
      if (clockElement) {
        clockElement.textContent = Utils.getLocalizedTime();
      }
      requestAnimationFrame(updateClock);
    };
    updateClock();
  }

  static hideMarquee() {
    const marqueeWrapper = DOM.getElement('.marquee-wrapper');
    if (marqueeWrapper) {
      marqueeWrapper.style.display = 'none';
    }
  }
}

// ============================================================================
// Keyboard Event Handlers
// ============================================================================

class KeyboardHandler {
  static registerEscapeHandler() {
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  static handleEscapeKey(event) {
    if (event.keyCode !== KEYCODES.ESCAPE) {
      appState.lastEscapePress = 0;
      return;
    }

    const currentTime = event.timeStamp;
    const timeSinceLastPress = currentTime - appState.lastEscapePress;

    if (appState.lastEscapePress && timeSinceLastPress < CONFIG.ESCAPE_KEY_THRESHOLD) {
      location.reload(true);
    } else {
      appState.lastEscapePress = currentTime;
    }
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

class EventHandlers {
  static async handleLoadMenu() {
    const fileInput = DOM.getElement('#fileInput');
    const templateSelect = DOM.getElement('#templateSelect');
    const fileError = DOM.getElement('#fileError');

    // Reset error
    fileError?.classList.add('hidden');

    // Validate file input
    if (!fileInput?.files?.length) {
      if (fileError) {
        fileError.classList.remove('hidden');
        fileError.textContent = 'Please choose a menu file';
      }
      return;
    }

    const file = fileInput.files[0];
    const templateName = templateSelect?.value || 'default';

    try {
      await MenuManager.importMenu(file, templateName);
      modalManager.close();
    } catch (error) {
      if (fileError) {
        fileError.classList.remove('hidden');
        fileError.textContent = error.message;
      }
      console.error('Import error:', error);
    }
  }

  static handleEditMenu() {
    let seconds = 3;
    
    modalManager.open(
      'You are now being redirected to the menu editor',
      `<p id="redirect" class="mb-4">Redirecting in ${seconds} seconds...</p>`,
      false
    );

    const timer = setInterval(() => {
      const redirectElement = DOM.getElement('#redirect');
      if (!redirectElement) {
        clearInterval(timer);
        return;
      }

      seconds--;
      
      if (seconds < 0) {
        clearInterval(timer);
        redirectElement.textContent = 'You are now being redirected.';
        window.location.href = Utils.getBaseUrl() + CONFIG.PATHS.EDITOR;
      } else {
        redirectElement.textContent = `Redirecting in ${seconds} seconds...`;
      }
    }, 1000);
  }

  static showLoadMenuModal() {
    const modalContent = `
      <label for="fileInput" class="text-lg font-medium mb-2">Choose a File:</label>
      <input type="file" id="fileInput" class="w-full border border-gray-300 p-2 rounded-md mb-4" accept=".json" />
      <p id="fileError" class="text-red-500 text-sm mb-4 hidden">Please choose a menu file.</p>

      <label for="templateSelect" class="text-lg font-medium mb-2">Select a Template:</label>
      ${TemplateManager.generateSelectHTML()}
      
      <p id="templateError" class="text-red-500 text-sm mb-4 hidden"></p>

      <div class="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
        <button class="import-menu w-full md:w-auto inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-green-500">
          Load
        </button>
        <button onclick="hideModal()" class="w-full md:w-auto inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-300 h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-gray-500">
          Cancel
        </button>
      </div>
    `;

    modalManager.open('Load Menu', modalContent);

    // Attach import handler
    setTimeout(() => {
      DOM.getElement('.import-menu')?.addEventListener('click', this.handleLoadMenu);
    }, 100);
  }

  static showIssueModal() {
    const modalContent = `
      <p class="mb-4">
        If you've encountered an issue or have a feature request, please use our GitHub page.
        Your feedback will help improve this tool!
      </p>
      <div class="bg-yellow-100 text-yellow-800 p-3 mb-4 rounded">
        <p class="font-bold">Note:</p>
        <p>This process redirects you to GitHub. Don't worry; it's a platform to manage issues and features.</p>
      </div>

      <div class="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
        <a href="https://github.com/MarketingPipeline/Termino.js/issues/new?title=New issue!">
          <button class="w-full md:w-auto inline-flex items-center justify-center font-medium transition-colors h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-green-500 hover:bg-green-600">
            Yes, Redirect Me
          </button>
        </a>
        <button onclick="hideModal()" class="w-full md:w-auto inline-flex items-center justify-center font-medium transition-colors h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-gray-500 hover:bg-gray-600">
          No, I'll do it later
        </button>
      </div>
    `;

    modalManager.open('Reporting an Issue or Requesting a Feature', modalContent);
  }

  static showDonateModal() {
    const modalContent = `
      <p class="mb-4">
        Enjoying this free & open-source software? Consider donating to the creator Jared Van Valkengoed to support ongoing development.
        Your contribution helps maintain and improve the tools you love!
      </p>
      <div class="bg-blue-100 text-blue-800 p-3 mb-4 rounded">
        <p class="font-bold">Why Donate?</p>
        <p>Open-source projects rely on community support. Your donation helps keep the project alive and thriving!</p>
      </div>

      <div class="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
        <a href="https://www.paypal.com/donate/?hosted_button_id=UUENWTEFHBXNJ">
          <button class="w-full md:w-auto inline-flex items-center justify-center font-medium transition-colors h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-green-500 hover:bg-green-600">
            Donate
          </button>
        </a>
        <button onclick="hideModal()" class="w-full md:w-auto inline-flex items-center justify-center font-medium transition-colors h-10 text-white text-lg md:text-xl p-2 md:p-4 rounded-lg bg-gray-500 hover:bg-gray-600">
          Not now, maybe later
        </button>
      </div>
    `;

    modalManager.open('Donate & Support the Creator!', modalContent);
  }
}

// ============================================================================
// Tutorial/Slide Management
// ============================================================================

class TutorialManager {
  static toggle() {
    const wrapper = DOM.getElement('#exampleWrapper');
    if (!wrapper) return;

    wrapper.classList.remove('hide-display');
    wrapper.style.visibility = 'visible';
    wrapper.classList.toggle('translate-y-full');
    wrapper.focus();

    appState.isSlideOpen = true;
    window.hideOverlay?.();

    wrapper.addEventListener('transitionend', () => {
      wrapper.classList.remove('hidden');
    }, { once: true });
  }

  static close() {
    const wrapper = DOM.getElement('#exampleWrapper');
    if (!wrapper) return;

    wrapper.classList.add('translate-y-full');

    if (appState.isSlideOpen) {
      window.showOverlay?.();
      appState.isSlideOpen = false;
    }

    wrapper.addEventListener('transitionend', async () => {
      wrapper.classList.add('hidden');
      wrapper.style.visibility = 'hidden';
      await Utils.delay(300);
      wrapper.classList.add('hide-display');
    }, { once: true });
  }
}

window.closeSlide = () => TutorialManager.close();

// ============================================================================
// Version Display
// ============================================================================

function displayVersion() {
  DOM.getAllElements('.version-num').forEach(element => {
    element.textContent = CONFIG.VERSION;
  });
}

// ============================================================================
// Initialization
// ============================================================================

async function initializeApp() {
  try {
    displayVersion();

    // Fetch templates
    const templates = await TemplateManager.fetchTemplates();
    appState.setTemplateOptions(templates);

    // Setup event listeners
    DOM.getElement('.load-a-menu')?.addEventListener('click', EventHandlers.showLoadMenuModal);
    DOM.getElement('.edit-menu')?.addEventListener('click', EventHandlers.handleEditMenu);
    DOM.getElement('.issue-menu')?.addEventListener('click', EventHandlers.showIssueModal);
    DOM.getElement('.donate-menu')?.addEventListener('click', EventHandlers.showDonateModal);
    DOM.getElement('.tutorial-menu')?.addEventListener('click', () => TutorialManager.toggle());

    // Hide page loader
    window.removeLoader?.(true);

    // Scroll to top
    document.body.scrollTo({ top: 0, behavior: 'smooth' });

    // Check URL params
    const params = Utils.parseUrlQuery();
    if (params.show === 'tutorial') {
      TutorialManager.toggle();
    }

  } catch (error) {
    console.error('Initialization error:', error);
    alert(`Failed to initialize app: ${error.message}`);
  }
}

// ============================================================================
// Page Show Event (handle back/forward cache)
// ============================================================================

window.addEventListener('pageshow', (event) => {
  if (event.persisted || (window.performance?.navigation?.type === 2)) {
    document.body.classList.add('page-loader-active');
    location.reload(true);
  }
});

// ============================================================================
// Window Load Event
// ============================================================================

window.addEventListener('load', initializeApp);

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AppState,
    Utils,
    TemplateManager,
    MenuManager,
    MenuValidator
  };
}
