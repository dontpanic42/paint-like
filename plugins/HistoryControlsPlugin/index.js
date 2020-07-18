class HistoryControlsPlugin extends Plugin {
    constructor() {
        super();
    }

    init() {
        const appCore = this.getAppManager().core;
        const history = this.getAppManager().core.historyManager;

        // Find the top-level 'edit' menu
        const editMenu = appCore.menuManager.find('edit');

        if(!editMenu) {
            console.warn('[HistoryControls]: Could not find edit menu, history controls not available');
        } else {

            // Create the menu item for "undo"
            const undoMenuItem = new MenuItem('Undo', 'undo');
            // Create a hotkey for for "undo"
            const undoHotKey = new HotKey(HotKeyModifier.CTRL, 'z');
            // When clicked, undo the last action
            undoMenuItem.addEventListener('click', () => history.undo());
            // Setup hotkey event handler
            undoHotKey.addEventListener('press', () => history.undo());
            // Add the hotkey to the menu item
            undoMenuItem.setHotKey(undoHotKey);
            // Add the menu item to the 'edit' menu
            editMenu.addChild(undoMenuItem);
            

            // Create the menu item for "repeat"
            const repeatMenuItem = new MenuItem('Repeat', 'repeat');
            // Create a hotkey for for "repeat"
            const repeatHotKey = new HotKey(HotKeyModifier.CTRL, 'y');
            // When clicked, redo the last action
            repeatMenuItem.addEventListener('click', () => history.repeat());
            // Setup hotkey event handler
            repeatHotKey.addEventListener('press', () => history.repeat());
            // Add the hotkey to the menu item
            repeatMenuItem.setHotKey(repeatHotKey);
            // Add the menu item tho the 'edit' menu
            editMenu.addChild(repeatMenuItem);

            // Define the event handler for item state changes. This is called every
            // time any actions are performed on the history
            const historyStateChangeHandler = () => {
                const canUndo = history.canUndo();
                const canRepeat = history.canRepeat();

                // Enable the unde menu and hotkey only if we have action that can be undone
                undoMenuItem.setEnabled(canUndo);
                undoHotKey.setEnabled(canUndo)

                // Enable the repeat menu and hotkey only if we have actions that can be redone
                repeatMenuItem.setEnabled(canRepeat);
                repeatHotKey.setEnabled(canRepeat)
            }

            // Add all event listeners
            history.addEventListener('undo', historyStateChangeHandler);
            history.addEventListener('repeat', historyStateChangeHandler);
            history.addEventListener('push', historyStateChangeHandler);

            // Initial setup of the menu item state
            historyStateChangeHandler();
        }
    }
}

// Register plugin in plugin registry
window.plugins.HistoryControlsPlugin = HistoryControlsPlugin;