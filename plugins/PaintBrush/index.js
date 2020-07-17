class PaintBrushTool extends Tool {
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
            const ctx = this.canvas.context;
            const cvs = ctx.canvas;

            // Save 'before' state for history
            const previousImageData = ctx.getImageData(0, 0, cvs.width, cvs.height);

            this.canvas.applyPreview();

            // Save 'after' state for history
            const currentImageData = ctx.getImageData(0, 0, cvs.width, cvs.height);

            // Construct undo/redo actions
            const historyItem = new HistoryItem(
                `Paint with ${this.getName()}`, 
                () => ctx.putImageData(previousImageData, 0, 0),
                () => ctx.putImageData(currentImageData, 0, 0));

            // Push them to the current history
            history.push(historyItem);
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
        return 'Paint Brush';
    }

    getDescription() {
        return 'Draw with the mouse';
    }

    getButtonCssClass() {
        return 'paint-brush-tool-button';
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

class PaintBrush extends Plugin {
    constructor() {
        super();
        console.log('THis is the paintbrush tool!');
    }

    getResources() {
        return { 
            css: ['paintbrush.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new PaintBrushTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.PaintBrush = PaintBrush;