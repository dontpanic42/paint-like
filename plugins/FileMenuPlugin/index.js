class FileMenuPlugin extends Plugin {
    constructor() {
        super();
    }

    clickSaveMenu({core}) {
        // For now: Always save as png
        const fileType = FileMenuPlugin.fileTypes[0];
        // For now: Use hardcoded filename
        const fileName = 'file'
        // Construct anchor element to 'click' on
        const link = document.createElement('a');
        // Set the file name
        link.download = `${fileName}.${fileType.suffix}`;
        // Get reference to the current main canvas
        const canvas = core.drawingArea.canvas.htmlElement;
        // Construct a data url for the selected filetype
        const dataUrl = canvas.toDataURL(fileType.mime);
        // Set the data url as link target
        link.href = dataUrl;
        // Click to download the url
        link.click();
    }

    clickNewMenu({core}) {
        // For now: Use simple confirm message box to ask for confirmation
        if(confirm('Are you sure you want to create a new image?')) {
            // Get the clear color
            const clearColor = core.colorManager.getBackgroundColorAsRgb();
            // Clear the canvas
            core.drawingArea.canvas.clear(clearColor);
        }
    }

    init() {
        const appManager = this.getAppManager();
        const appCore = appManager.core;
        const fileMenu = appCore.menuManager.find('file');

        if(!fileMenu) {
            console.warn('[FileMenuPlugin]: Cannot find file menu.');
            return;
        }

        [
            {name: 'New',   handler: 'clickNewMenu',  modifier: 'n'},
            {name: 'Save',  handler: 'clickSaveMenu', modifier: 's'}
        ].forEach(({name, handler, modifier}) => {
            // Create a new menu entry for the file menu
            const menuItem = new MenuItem(name);
            // Create a new hotkey for the file menu entry
            const menuHotkey = new HotKey(HotKeyModifier.CTRL, modifier);
            // Create event handler lambda function
            const eventHandler = () => this[handler](appManager);
            // Attach event handler to menu
            menuItem.addEventListener('click', eventHandler);
            // Attach event handler to hotkey
            menuHotkey.addEventListener('press', eventHandler);
            // Attach hotkey to menu item
            menuItem.setHotKey(menuHotkey)
            // Attach menu item to file menu
            fileMenu.addChild(menuItem);
        });

        /*
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

        */
    }
}

FileMenuPlugin.fileTypes = [
    {name: 'png', mime: 'image/png', suffix: 'png'},
    {name: 'jpg', mime: 'image/jpg', suffix: 'jpg'}
]

// Register plugin in plugin registry
window.plugins.FileMenuPlugin = FileMenuPlugin;