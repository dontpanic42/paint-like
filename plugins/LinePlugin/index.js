class LineTool extends Tool {
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
            previousPoint.x = e.canvasX;
            previousPoint.y = e.canvasY;
        };

        this.mouseUpEventHandler = () => {
            history.helper.historizedApplyPreview(canvas, `Paint with ${this.getName()}`);
        };

        this.mouseMoveEventHandler = (e) => {
            canvas.clearPreview();

            algoLib.drawLine(
                canvas.previewContext, 
                previousPoint.x, 
                previousPoint.y, 
                e.canvasX, 
                e.canvasY, 
                lineWidth, 
                color.getForegroundColorAsRgb());
        };
    }

    getName() {
        return 'Line Tool';
    }

    getDescription() {
        return 'Draw with the mouse';
    }

    getButtonCssClass() {
        return 'line-tool-button';
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

class LinePlugin extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['line.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new LineTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.LinePlugin = LinePlugin;