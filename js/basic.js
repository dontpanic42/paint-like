class EventEmitter {
    constructor(debug = false) {
        this.eventEmitterEventDict = {};
        this.eventEmitterDebugMode = debug;
    }

    setEventEmitterDebugModeEnabled(enabled) {
        this.eventEmitterDebugMode = enabled;
    }

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

    init() {

    }
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