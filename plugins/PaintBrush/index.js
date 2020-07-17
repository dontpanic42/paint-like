class PaintBrushTool extends Tool {
    constructor(canvas, color, algoLib) {
        super();

        this.canvas = canvas;

        const lineWidth = 1;
        const previousPoint = {x: 0, y: 0};

        this.mouseDownEventHandler = (e) => {
            previousPoint.x = e.canvasX | 0;
            previousPoint.y = e.canvasY | 0;
            
            console.log('color', color.getForegroundColorAsRgb());

            algoLib.putPixel(
                canvas.previewContext, 
                previousPoint.x, 
                previousPoint.y, 
                lineWidth, 
                color.getForegroundColorAsRgb());
        };

        this.mouseUpEventHandler = () => {
            this.canvas.applyPreview();
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
        const canvas = appCore.drawingArea.canvas;
        const color = appCore.colorManager;
        const algoLib = this.getAppManager().util.algoLib;

        appCore.toolManager.addTool(new PaintBrushTool(canvas, color, algoLib));
    }
}

// Register plugin in plugin registry
window.plugins.PaintBrush = PaintBrush;