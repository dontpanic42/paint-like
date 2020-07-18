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
     * Prints a debug message whenever debug mode is enabled
     * @param  {...any} args Parameters passed to console.log
     */
    eventEmitterDebugPrint(...args) {
        if(this.eventEmitterDebugMode) {
            console.log('[EventEmitter]:', ...args);
        }
    }

    /**
     * Register a new event listener for a given event.
     * Should the eventType be an array, the event listener is registered for all 
     * events specified in the array.
     * @param {string|Array} eventType Event name or array of event names 
     * @param {function} listener 
     */
    addEventListener(eventType, listener) {
        // Check if eventType is an array
        if(eventType instanceof Array) {
            // If it is an array, call this method for each of the elements in the array and return
            return eventType.forEach((e) => this.addEventListener(e, listener));
        }

        // Ensure that the event type is lower case
        eventType = eventType.toLowerCase().trim();

        // Print debug message 
        this.eventEmitterDebugPrint(`Adding event listener for "${eventType}"`, listener);

        // Check if the event handler array already exists for this event
        if(typeof(this.eventEmitterEventDict[eventType]) === 'undefined') {
            // If not, create it
            this.eventEmitterEventDict[eventType] = [];
        }

        // Check if the event listener is already registered
        if(this.eventEmitterEventDict[eventType].indexOf(listener) != -1) {
            // If it is, throw an error. This should not happen
            throw new Error(`[EventEmitter]: Event listener already exists for event "${eventType}"`);
        }

        // Register the event listener
        this.eventEmitterEventDict[eventType].push(listener);
    }

    /**
     * Removes a given event listener from a given event.
     * Should the eventType be an array, the event listener is removed for all 
     * events specified in the array.
     * @param {string|Array} eventType Event name or array of event names
     * @param {function} listener 
     */
    removeEventListener(eventType, listener) {
        // Check if eventType is an array
        if(eventType instanceof Array) {
            // If it is an array, call this method for each of the elements in the array and return
            return eventType.forEach((e) => this.removeEventListener(e, listener));
        }

        // Ensure that the event type is lower case
        eventType = eventType.toLowerCase().trim();

        // Print debug message 
        this.eventEmitterDebugPrint(`Removing event listener for "${eventType}"`, listener);

        // Get a list of listeners for the current event
        const listeners = this.eventEmitterEventDict[eventType] || [];
        // Get the index of the current listener in the event emitter dict
        const listenerIndex = listeners.indexOf(listener);

        if(listenerIndex == -1) {
            // If the listener does not exist, show a warning. This does not hurt, but it indicates that something is wrong
            console.warn(`[EventEmitter]: Warning: Attempt to remove listener for event "${eventType}", but no listener defined for event`);
        } else {
            // Remove the listener from the event handlers list
            listeners.splice(listenerIndex, 1);
        }
    }

    /**
     * Triggers all event listeners for a given event with the given arguments
     * @param {string} eventType 
     * @param  {...any} eventDataArgs Data passed to event handlers
     */
    emitEvent(eventType, ...eventDataArgs) {
        eventType = eventType.toLowerCase().trim();

        // Print debug message 
        this.eventEmitterDebugPrint(`Triggering event "${eventType}"`, eventDataArgs);

        (this.eventEmitterEventDict[eventType] || []).forEach((listener) => {
            try {
                listener(...eventDataArgs);
            } catch(e) {
                console.warn(`[EventEmitter]: Error while executing listener for "${eventType}"`, e);
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
    constructor(debugMode = false) {
        this.pluginLoaderDebugMode = debugMode;
        this.plugins = {};
        // Global plugin registry setup
        window.plugins = {};
    }

    debugPrint(...args) {
        if(this.pluginLoaderDebugMode) {
            console.log('[PluginLoader]:', ...args);
        }
    }

    loadJsFile(fullPath) {
        return new Promise((resolve, reject) => {
            this.debugPrint(`Loading javascript file ${fullPath}`)

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
            this.debugPrint(`Loading css file ${fullPath}`)

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
            console.error(`[PluginLoader]: Unable to load plugin "${name}" - class does not exist in "window.plugins" after loading.`);
            return;
        } 
            
        this.debugPrint(`New plugin "${name}" exists in namespace.`);

        // Instanciate plugin
        const plugin = this.plugins[name] = new window.plugins[name](appManager);
        if (!(plugin instanceof Plugin)) {
            console.error(`[PluginLoader]: Unable to load plugin "${name}" - plugin not instance of "Plugin" baseclass`)
            return;
        }

        // Fetch resource requirements by plugin 
        const resources = plugin.getResources();
        // Load css files required by plugin
        await Promise.all(resources.css.map((r) => {
            const fullPath = `plugins/${name}/css/${r}`;
            return this.loadCssFile(fullPath).then(() => {
                this.debugPrint(`Done loading css resource ${r} for plugin ${name}`);
            });
        }));

        try {
            // Run plugin initialization
            const r = plugin.init();
            // When the result is a promise, we need to wait for the initialization to be finisehd
            if(r instanceof Promise) {
                // Wait for it to be resolved
                await r;
            }

            console.log(`[PluginLoader]: OK: ${name}`);
        } catch (e) {
            // When there was an error during plugin initialization, show an error message
            console.error(`[PluginLoader]: FAILED-INIT: ${name}`, e);
        }   
    }
}

/**
 * Obect that represents one discrete step in the 
 * current history
 */
class HistoryItem {
    constructor(description, undoCallback, repeatCallback) {
        this.description = description;
        this.undoCallback = undoCallback;
        this.repeatCallback = repeatCallback;
    }

    /**
     * Undo the action performed in this history event.
     * Always returns a promise.
     */
    undo() {
        const r = this.undoCallback();
        return (r instanceof Promise) ? r : Promise.resolve();
    }

    /**
     * Repeats a previously undone history event.
     * Always returns a promise.
     */
    repeat() {
        const r = this.repeatCallback();
        return (r instanceof Promise) ? r : Promise.resolve();
    }

    /**
     * Returns a string describing this history
     * event in human readable form
     */
    getDescription() {
        return this.description;
    }
}

/**
 * Class that manages a history stack, including undo, repeat etc.
 * 
 * This implements a linear history stack, so as soon as a new history
 * item is pushed, it's no longer possible to repeat previous actions.
 */
class HistoryManager extends EventEmitter {
    constructor() {
        super();

        this.historySize = 3;
        this.historyPointer = -1;
        this.history = [];
    }

    /**
     * Returns true when there are event on the stack that can be undone
     */
    canUndo() {
        return this.history.length > 0 && this.historyPointer >= 0;
    }

    /**
     * Returns true when there are previously undone events still on the stack
     */
    canRepeat() {
        return this.history.length - 1 > this.historyPointer;
    }

    /**
     * Undo the last upper most not-yet-undone action on the stack
     */
    async undo() {
        if(this.canUndo()) {
            const item = this.history[this.historyPointer--];
            await item.undo();

            this.emitEvent('undo', this, item);
        } else {
            console.warn('[HistoryManager]: Attempting to undo but no undo item available');
        }
    }

    /**
     * Repeats the last undone action on the stack
     */
    async repeat() {
        if(this.canRepeat()) {
            const item = this.history[++this.historyPointer];
            await item.repeat();

            this.emitEvent('repeat', this, item);
        } else {
            console.warn('[HistoryManager]: Attempting to repeat but no repeat item available');
        }
    }

    /**
     * Pushes a new history event item on the stack. Note that as soon as a history item
     * is pushed you can no longer repeat previously undone actions.
     * @param {HistoryItem} item 
     */
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