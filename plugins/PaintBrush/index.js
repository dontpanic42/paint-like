class PaintBrushTool extends Tool {
    constructor(canvas, color) {
        super();

        this.canvas = canvas;
        this.color = color;

        this.size = 1;

        this.previousPoint = {x: 0, y: 0};

        this.mouseDownEventHandler = (e) => {
            this.previousPoint.x = e.canvasX
            this.previousPoint.y = e.canvasY

            // Draw initial "dot"
            const ctx = this.canvas.previewContext;
            
            ctx.beginPath();
            ctx.lineWidth = this.size;
            ctx.strokeStyle = this.color.getForegroundColor();
            ctx.fillRect(e.canvasX | 0, e.canvasY | 0, 1, 1);
            ctx.stroke();
        };

        this.mouseUpEventHandler = () => {
            this.canvas.applyPreview();
        };

        this.mouseMoveEventHandler = (e) => {
            const ctx = this.canvas.previewContext;
            
            ctx.beginPath();
            ctx.lineWidth = this.size;
            ctx.strokeStyle = this.color.getForegroundColor();
            ctx.moveTo(this.previousPoint.x, this.previousPoint.y);
            ctx.lineTo(e.canvasX | 0, e.canvasY | 0);
            ctx.stroke();

            this.previousPoint.x = e.canvasX | 0;
            this.previousPoint.y = e.canvasY | 0;
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

        appCore.toolManager.addTool(new PaintBrushTool(canvas, color));
    }
}

// Register plugin in plugin registry
window.plugins.PaintBrush = PaintBrush;