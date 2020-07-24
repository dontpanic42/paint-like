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
    }
}

FileMenuPlugin.fileTypes = [
    {name: 'png', mime: 'image/png', suffix: 'png'},
    {name: 'jpg', mime: 'image/jpg', suffix: 'jpg'}
]

// Register plugin in plugin registry
window.plugins.FileMenuPlugin = FileMenuPlugin;