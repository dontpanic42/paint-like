class PencilTool extends Tool {
    constructor(appManager) {
        super();

        const appCore = appManager.core;
        const canvas = this.canvas = appCore.drawingArea.canvas;
        const color = appCore.colorManager;
        const history = appCore.historyManager;
        const algoLib = appManager.util.algoLib;

        const lineWidth = 1;
        const previousPoint = {x: 0, y: 0};

        this.mouseDownEventHandler = (e) => {
            previousPoint.x = e.canvasX | 0;
            previousPoint.y = e.canvasY | 0;

            algoLib.putPixel(
                canvas.previewContext, 
                previousPoint.x, 
                previousPoint.y, 
                lineWidth, 
                color.getForegroundColorAsRgb());
        };

        this.mouseUpEventHandler = () => {
            history.helper.historizedApplyPreview(canvas, `Paint with ${this.getName()}`);
        };

        this.mouseMoveEventHandler = (e) => {
            
            algoLib.drawLine(
                canvas.previewContext, 
                previousPoint.x, 
                previousPoint.y, 
                e.canvasX, 
                e.canvasY, 
                lineWidth, 
                color.getForegroundColorAsRgb());

            previousPoint.x = e.canvasX | 0;
            previousPoint.y = e.canvasY | 0;
        };
    }

    getName() {
        return 'Pencil';
    }

    getDescription() {
        return 'Draw with the mouse';
    }

    getButtonCssClass() {
        return 'pencil-tool-button';
    }

    // Called when the tool was selected by the user
    onActivate() {
        this.canvas.addEventListener('mousedown', this.mouseDownEventHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpEventHandler);
        this.canvas.addEventListener('mousemove', this.mouseMoveEventHandler);
    }

    // Called when another tool was selected by the user
    onDeactivate() {
        this.canvas.removeEventListener('mousedown', this.mouseDownEventHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpEventHandler);
        this.canvas.removeEventListener('mousemove', this.mouseMoveEventHandler);
    }
}

class PencilPlugin extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['pencil.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new PencilTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.PencilPlugin = PencilPlugin;