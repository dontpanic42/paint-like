/**
 * EventEmitter is a base class for almost all data classes in the application
 */
class EventEmitter {
    constructor(debug = false) {
        this.eventEmitterEventDict = {};
        this.eventEmitterDebugMode = debug;
    }

    /**
     * Enables or disables event debugging mode
     * @param {boolean} enabled 
     */
    setEventEmitterDebugModeEnabled(enabled) {
        this.eventEmitterDebugMode = enabled;
    }

    /**
     * Register a new event listener for a given event
     * @param {string} eventType 
     * @param {function} listener 
     */
    addEventListener(eventType, listener) {
        eventType = eventType.toLowerCase().trim();

        if(this.eventEmitterDebugMode) {
            console.log(`[EventEmitter Debug]: Adding event listener for "${eventType}"`, listener);
        }

        if(typeof(this.eventEmitterEventDict[eventType]) === 'undefined') {
            this.eventEmitterEventDict[eventType] = [];
        }

        if(this.eventEmitterEventDict[eventType].indexOf(listener) != -1) {
            throw new Error(`Event listener already exists for event "${eventType}"`);
        }

        this.eventEmitterEventDict[eventType].push(listener);
    }

    /**
     * Removes a given event listener from a given event
     * @param {string} eventType 
     * @param {function} listener 
     */
    removeEventListener(eventType, listener) {
        eventType = eventType.toLowerCase().trim();

        if(this.eventEmitterDebugMode) {
            console.log(`[EventEmitter Debug]: Removing event listener for "${eventType}"`, listener);
        }

        const listeners = this.eventEmitterEventDict[eventType] || [];
        const listenerIndex = listeners.indexOf(listener);
        if(listenerIndex == -1) {
            console.warn(`Warning: Attempt to remove listener for event "${eventType}", but no listener defined for event`);
        } else {
            listeners.splice(listenerIndex, 1);
        }
    }

    /**
     * Triggers all event listeners for a given event with the given arguments
     * @param {string} eventType 
     * @param  {...any} eventDataArgs 
     */
    emitEvent(eventType, ...eventDataArgs) {
        eventType = eventType.toLowerCase().trim();

        if(this.eventEmitterDebugMode) {
            console.log(`[EventEmitter Debug]: Triggering event "${eventType}"`, eventDataArgs);
        }

        (this.eventEmitterEventDict[eventType] || []).forEach((listener) => {
            try {
                listener(...eventDataArgs);
            } catch(e) {
                console.warn(`Error while executing listener for "${eventType}"`, e);
            }
        });
    }
}

/******************************************************************************
 * Plugin Management Classes
 * 
 * - Plugin: Base class for plugins
 * - PluginLoader: Loads plugins and resources
 *****************************************************************************/

class Plugin extends EventEmitter {
    constructor() {
        super();

        this.appManager = appManager;
    }

    getName() {
        return 'generic plugin'
    }

    getAppManager() {
        return this.appManager;
    }

    getResources() {
        return { 
            css: []
        };
    }

    init() { }
}

class PluginLoader {
    constructor() {
        this.pluginLoaderDebugMode = true;
        this.plugins = {};
        // Global plugin registry setup
        window.plugins = {};
    }

    loadJsFile(fullPath) {
        return new Promise((resolve, reject) => {
            if(this.pluginLoaderDebugMode) {
                console.log(`[PluginLoader]: Loading javascript file ${fullPath}`)
            }

            const scriptElement = document.createElement('script');
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            scriptElement.type = 'application/javascript';
            scriptElement.src = fullPath;
            document.head.appendChild(scriptElement);
        });
    }

    loadCssFile(fullPath) {
        return new Promise((resolve, reject) => {
            if(this.pluginLoaderDebugMode) {
                console.log(`[PluginLoader]: Loading css file ${fullPath}`)
            }

            const linkElement = document.createElement('link');
            linkElement.onload = resolve;
            linkElement.onerror = reject;
            linkElement.href = fullPath;
            linkElement.type = 'text/css';
            linkElement.rel = 'stylesheet';
            document.head.appendChild(linkElement);
        });
    }

    async loadPlugin(name, appManager) {

        // Load plugin from javascript file
        const jsFile = `plugins/${name}/index.js`;
        await this.loadJsFile(jsFile);

        // Ensure the plugin was loaded successfully
        if(typeof(window.plugins[name]) === 'undefined') {
            throw new Error(`[PluginLoader]: Unable to load plugin "${name}" - class does not exist in "window.plugins" after loading.`);
        } else if(this.pluginLoaderDebugMode) {
            console.log(`[PluginLoader]: New plugin "${name}" exists in namespace.`);
        }

        // Instanciate plugin
        const plugin = this.plugins[name] = new window.plugins[name](appManager);
        if (!(plugin instanceof Plugin)) {
            throw new Error(`[PluginLoader]: Unable to load plugin "${name}" - plugin not instance of "Plugin" baseclass`)
        }

        // Fetch resource requirements by plugin 
        const resources = plugin.getResources();
        // Load css files required by plugin
        await Promise.all(resources.css.map((r) => {
            const fullPath = `plugins/${name}/css/${r}`;
            return this.loadCssFile(fullPath).then(() => {
                if(this.pluginLoaderDebugMode) {
                    console.log(`[PluginLoader]: Done loading css resource ${r} for plugin ${name}`);
                }
            });
        }));

        // Run plugin initialization
        plugin.init();
    }
}

/******************************************************************************
 * History Management Classes
 * 
 * - HistoryItem: Item that represents one distinct entry in the history
 * - HistoryManager: Manager class for the apps history
 *****************************************************************************/

class HistoryItem {
    constructor(description, undoCallback, repeatCallback) {
        this.description = description;
        this.undoCallback = undoCallback;
        this.repeatCallback = repeatCallback;
    }

    undo() {
        const r = this.undoCallback();
        if(r instanceof Promise) {
            return r;
        } else {
            return Promise.resolve();
        }
    }

    repeat() {
        const r = this.repeatCallback();
        if(r instanceof Promise) {
            return r;
        } else {
            return Promise.resolve();
        }
    }

    getDescription() {
        return this.description;
    }
}

class HistoryManager extends EventEmitter {
    constructor() {
        super();

        this.historySize = 3;
        this.historyPointer = -1;
        this.history = [];
    }

    canUndo() {
        return this.history.length > 0 && this.historyPointer >= 0;
    }

    canRepeat() {
        return this.history.length - 1 > this.historyPointer;
    }

    // Undo the latest action
    async undo() {
        if(this.canUndo()) {
            const item = this.history[this.historyPointer--];
            await item.undo();

            this.emitEvent('undo', this, item);
        } else {
            console.warn('[HistoryManager]: Attempting to undo but no undo item available');
        }
    }

    // Repeat the last action
    async repeat() {
        if(this.canRepeat()) {
            const item = this.history[++this.historyPointer];
            await item.repeat();

            this.emitEvent('repeat', this, item);
        } else {
            console.warn('[HistoryManager]: Attempting to repeat but no repeat item available');
        }
    }

    // Push a new history item on the history stack
    push(item) {
        if(item instanceof HistoryItem) {
            // Make sure to delete all 'repeat' actions after the current item
            // We are on an alternate timeline now (this *is* the darkest one)
            this.history = this.history.slice(0, this.historyPointer + 1);
            this.history.push(item);
            
            // Check that we don't overflow the max history size. Otherwise, delete 
            // history from the beginning
            if(this.history.length > this.historySize) {
                this.history.shift();
            }

            // Correct the history pointer - it should now point to the last action
            this.historyPointer = this.history.length - 1;
            // Emit event
            this.emitEvent('push', this, item);
        } else {
            console.warn('[HistoryManager]: Attempting to push history item that is not instance of HistoryItem');
        }
    }
}