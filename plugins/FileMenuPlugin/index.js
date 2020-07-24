class FileMenuPlugin extends Plugin {
    constructor() {
        super();
    }

    async clickOpenMenu({core}) {
        if(!confirm('Are you sure you want to create a new image?')) {
            return;
        }

        /**
         * Shows a file chooser, returns a list of files
         * @param {Array} acceptMimes array that contains list of accepted mime types 
         */
        const showFileInput = (acceptMimes) => {
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', acceptMimes.join(', '));
                input.setAttribute('multiple', 'false');
                input.addEventListener('input', (e) => {
                    resolve(input.files);
                })
                input.click();
            });
        }

        /**
         * Reads a file, converts it to a data url
         * @param {File} file 
         */
        const readDataUrl = (file) => {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => resolve(fileReader.result);
                fileReader.onerror = (e) => reject(e);
                fileReader.readAsDataURL(file);
            });
        }

        /**
         * Creates an image element from a given data url
         * @param {String} dataUrl 
         */
        const dataToImage = (dataUrl) => {
            return new Promise((resolve, reject) => {
                const img = document.createElement('img');
                img.onload = () => resolve(img);
                img.onerror = (e) => reject(e);
                img.src = dataUrl;
            });
        }

        // We accept any image file type for opening
        const openAccept = FileMenuPlugin.fileTypes.map(f => f.mime);
        // Show the file chooser
        const files = await showFileInput(openAccept);
        // Read data form file
        const data = await readDataUrl(files[0]);
        // Convert data to image
        const img = await dataToImage(data);

        // Update the drawing area size to the size of the image
        core.drawingArea.setSize(img.width, img.height);
        // Get the drawing context
        const ctx = core.drawingArea.canvas.context;
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0); 
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
            {name: 'Open',  handler: 'clickOpenMenu', modifier: 'o'},
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
    {name: 'jpg', mime: 'image/jpeg', suffix: 'jpg'}
]

// Register plugin in plugin registry
window.plugins.FileMenuPlugin = FileMenuPlugin;