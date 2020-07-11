class PaintLineTool extends Tool {
    constructor(canvas) {
        super();

        this.canvas = canvas;
        this.previousPoint = {x: 0, y: 0};

        this.mouseDownEventHandler = (e) => {
            this.previousPoint.x = e.clientX
            this.previousPoint.y = e.clientY
        };

        this.mouseUpEventHandler = () => {
            this.canvas.applyPreview();
        };

        this.mouseMoveEventHandler = (e) => {
            this.canvas.clearPreview();

            const rect = this.canvas.htmlElement.getBoundingClientRect();
            const ctx = this.canvas.previewContext;
            
            ctx.beginPath();
            ctx.moveTo(this.previousPoint.x - rect.left, this.previousPoint.y - rect.top);
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
        };
    }

    getName() {
        return 'Paint Brush';
    }

    getDescription() {
        return 'Draw with the mouse';
    }

    getButtonCssClass() {
        return 'paint-line-tool-button';
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

class PaintLine extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['paintline.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;
        const canvas = appCore.drawingArea.canvas;

        appCore.toolManager.addTool(new PaintLineTool(canvas));
    }
}

// Register plugin in plugin registry
window.plugins.PaintLine = PaintLine;