class ZoomControlsTool extends Tool {
    constructor(drawingArea, canvas) {
        super();

        this.drawingArea = drawingArea;
        this.canvas = canvas;

        this.zoomLevels = [
            1.0,
            1.25,
            1.5,
            1.75
        ];

        this.currentZoomLevel = 0;

        this.toggleZoom = () => {
            if(++this.currentZoomLevel >= this.zoomLevels.length) {
                this.currentZoomLevel = 0;
            }
    
            this.drawingArea.setScale(
                this.zoomLevels[this.currentZoomLevel],
                this.zoomLevels[this.currentZoomLevel]
            );
        }
    }

    getName() {
        return 'Zoom';
    }

    getDescription() {
        return 'Zoom in or out on the drawing area';
    }

    getButtonCssClass() {
        return 'zoom-controls-tool-button';
    }

    // Called when the tool was selected by the user
    onActivate() {
        this.canvas.addEventListener('mouseup', this.toggleZoom);
    }

    // Called when another tool was selected by the user
    onDeactivate() {
        this.canvas.removeEventListener('mouseup', this.toggleZoom);
    }  

}

class ZoomControls extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['zoomcontrols.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new ZoomControlsTool(appCore.drawingArea, appCore.drawingArea.canvas));
    }
}

// Register plugin in plugin registry
window.plugins.ZoomControls = ZoomControls;