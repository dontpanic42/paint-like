class ZoomTool extends Tool {
    constructor(appManager) {
        super();

        this.appManager = appManager;
        this.drawingArea = appManager.core.drawingArea;

        // Note: Zoom levels should always be a multiple of 2!
        this.zoomLevels = [
            1.0,
            2.0,
            4.0,
            8.0
        ];
        
        this.canvas = appManager.core.drawingArea.canvas;

        // Let the current zoom level default to the first level
        this.currentZoomLevel = 0;

        // Event handler for zoom toggeling
        this.toggleZoomEventHandler = () => this.toggleZoom();

        // Setup menus
        this.setupZoomMenu();
    }

    /**
     * Set the zoom level to a given index value
     * @param {Number} level 
     */
    setZoomLevel(level) {
        this.drawingArea.setScale(
            this.zoomLevels[level],
            this.zoomLevels[level]
        );
    }

    /**
     * Cycles through all zoom levels
     */
    toggleZoom() {
        if(++this.currentZoomLevel >= this.zoomLevels.length) {
            this.currentZoomLevel = 0;
        }

        this.setZoomLevel(this.currentZoomLevel);
    }

    /**
     * Sets up the 'Zoom' menu with child menu items for each
     * available zoom level
     */
    setupZoomMenu() {
        const menuManager = this.appManager.core.menuManager;
        // Find the 'View' menu item
        const parentMenu = menuManager.find('view');
        // If we don't find the 'View' menu, we can't add our menus...
        if(!parentMenu) {
            console.warn('[ZoomControls]: Could not find parent view menu');
            return;
        }

        // Create the new top level 'Zoom' menu
        const zoomMenu = new MenuItem('Zoom', 'zoom');
        // Cycle trough the available zoom levels
        this.zoomLevels.forEach((level, index) => {
            // Create a new menu entry for the current zoom level
            const zoomMenuEntry = new MenuItem(`${level * 100}%`, `zoom-${level}`);
            // Set up the event handler for the menu item
            zoomMenuEntry.addEventListener('click', this.setZoomLevel.bind(this, index));
            // Add it to the top leve 'Zoom' menu
            zoomMenu.addChild(zoomMenuEntry);
        });

        // Add the top level 'Zoom' menu to the 'View' menu
        parentMenu.addChild(zoomMenu);
    }

    /**
     * Returns the human readable name of this tool
     */
    getName() {
        return 'Zoom';
    }

    /**
     * Returns a tooltip text for this tool
     */
    getDescription() {
        return 'Zoom in or out on the drawing area';
    }

    /**
     * Returns the css class for this tools tool button
     */
    getButtonCssClass() {
        return 'zoom-tool-button';
    }

    /**
     * Event handler that gets triggered when the tool becomes active
     */
    onActivate() {
        this.canvas.addEventListener('mouseup', this.toggleZoomEventHandler);
    }

    /**
     * Event handler that gets triggered when the tool becomes inactive
     */
    onDeactivate() {
        this.canvas.removeEventListener('mouseup', this.toggleZoomEventHandler);
    }  
}

/**
 * Main Zoom Controls Plugin class
 */
class ZoomControlsPlugin extends Plugin {
    constructor() {
        super();
    }

    /**
     * Returns resources that are required by this plugin
     */
    getResources() {
        return { 
            css: ['zoom.css']
        };
    }

    /**
     * Run the initialization logic for this plugin
     */
    init() {
        const appCore = this.getAppManager().core;
        // Add the new tool to the toolbar
        appCore.toolManager.addTool(new ZoomTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.ZoomControlsPlugin = ZoomControlsPlugin;