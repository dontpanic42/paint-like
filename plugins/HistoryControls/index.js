class HistoryControls extends Plugin {
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
            // When clicked, undo the last action
            undoMenuItem.addEventListener('click', () => history.undo());
            // Add the menu item to the 'edit' menu
            editMenu.addChild(undoMenuItem);

            // Create the menu item for "repeat"
            const repeatMenuItem = new MenuItem('Repeat', 'repeat');
            // When clicked, redo the last action
            repeatMenuItem.addEventListener('click', () => history.repeat());
            // Add the menu item tho the 'edit' menu
            editMenu.addChild(repeatMenuItem);

            // Define the event handler for item state changes. This is called every
            // time any actions are performed on the history
            const historyStateChangeHandler = () => {
                // Enable the unde menu only if we have action that can be undone
                undoMenuItem.setEnabled(history.canUndo());
                // Enable the repeat menu only if we have actions that can be redone
                repeatMenuItem.setEnabled(history.canRepeat());
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
window.plugins.HistoryControls = HistoryControls;