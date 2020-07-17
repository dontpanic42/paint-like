/**
 * Wrapper class for hotkey modifiers. Not to be used 
 * by plugin code, use constants instead
 */
class HotKeyModifier {
    constructor(name, order, isPressedTest) {
        this.name = name;
        this.order = order;
        this.isPressedTest = isPressedTest;
    }

    /**
     * Returns the human readable name of the modifier key
     */
    getName() {
        return this.name;
    }

    /**
     * Returns the order this modkey will appear in
     */
    getOrder() {
        return this.order;
    }

    /**
     * Checks the given keyboard event if the modifier is pressed
     * @param {KeyboardEvent} e 
     */
    test(e) {
        return this.isPressedTest(e);
    }
}

// Default hotkey modifiers
HotKeyModifier.CTRL =   new HotKeyModifier('Ctrl', 0, (e) => e.ctrlKey);
HotKeyModifier.SHIFT =  new HotKeyModifier('Shift', 1, (e) => e.shiftKey);
HotKeyModifier.ALT =    new HotKeyModifier('Alt', 2, (e) => e.altKey);
HotKeyModifier.META =   new HotKeyModifier('Meta', 4, (e) => e.metaKey);

/**
 * Class that represents/manages a global hotkey
 * 
 * Usage example:
 * 
 * aHotKey = new HotKey(HotKeyModifier.CTRL, 'y');
 * aHotKey.addEventListener('press', () => console.log('foo'));
 */
class HotKey extends EventEmitter {
    constructor(...args) {
        super(true);

        this.enabled = false;
        this.mods = [];

        // Walk through all the args and filter out all modifier
        // keys. Konvert remaining keys to upper case
        this.keys = args.filter((k) => {
            // If k is a modifier key...
            if(k instanceof HotKeyModifier) {
                // Add it to the list of modifier keys
                this.mods[k.getOrder()] = k;
                // Remove it from the list of keys
                return false;
            } 
            // It's not a modifier, keep it in the list
            return true;
        }).map((k) => k.toUpperCase());

        // Setup event handler
        this.checkKeyboardEventHandler = (e) => this.checkKeyboardEvent(e);

        // Enable by default
        this.setEnabled(true);
    }

    /**
     * Returns whether or not this hokey is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Enables/Disables this hotkey
     * @param {Boolean} val 
     */
    setEnabled(val) {
        if(val != this.enabled) {
            this.enabled = val;

            if(val) {
                // Enable the global event handler for this hotkey
                document.addEventListener('keyup', this.checkKeyboardEventHandler);
            } else {
                // Disable the global event handler for this hotkey
                document.removeEventListener('keyup', this.checkKeyboardEventHandler);
            }
            
            this.emitEvent('enabledchange', this, val);
        }
    }

    /**
     * Processes a given keyboard event
     * @param {KeyboardEvent} e 
     */
    checkKeyboardEvent(e) {
        // Filter out empty modkey slots
        const modKeys = this.mods.filter(mod => !!mod);
        // Check that all the remaining mod keys match
        const modsMatch = modKeys.length > 0 && modKeys.every(mod => mod.test(e));
        // Check that the key matches
        if(modsMatch && this.keys.indexOf(e.key.toUpperCase()) != -1) {
            // Emit the event
            this.emitEvent('press', this);
            e.preventDefault();
            e.stopPropagation();
            return false;
        } 
    }

    /**
     * Returns the hokey in human readable form
     */
    toString() {
        // Create a list of modifiers...
        return this.mods
            // ... remove unused modifier slots
            .filter(m => !!m)
            // Map modifiers to their string name
            .map(m => m.getName())
            // Add the non-modifier keys
            .concat(this.keys)
            // Join everything together
            .join('+');
    }
}

