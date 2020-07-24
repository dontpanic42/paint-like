class EllipseTool extends Tool {
    constructor(appManager) {
        super();

        const appCore = appManager.core;
        const canvas = this.canvas = appCore.drawingArea.canvas;
        const color = appCore.colorManager;
        const history = appCore.historyManager;
        const algoLib = appManager.util.algoLib;
        
        const previousPoint = {x: 0, y: 0};

        this.mode = EllipseTool.BORDER;
        this.lineWidth = 1;

        this.mouseDownEventHandler = (e) => {
            previousPoint.x = e.canvasX;
            previousPoint.y = e.canvasY;
        };

        this.mouseUpEventHandler = () => {
            history.helper.historizedApplyPreview(canvas, `Paint with ${this.getName()}`);
        };

        this.mouseMoveEventHandler = (e) => {
            canvas.clearPreview();

            if(this.mode & EllipseTool.FILL) {
                algoLib.drawEllipse(
                    canvas.previewContext, 
                    previousPoint.x, 
                    previousPoint.y, 
                    e.canvasX, 
                    e.canvasY, 
                    this.lineWidth, 
                    color.getBackgroundColorAsRgb(),
                    true);
            }

            if(this.mode & EllipseTool.BORDER) {
                algoLib.drawEllipse(
                    canvas.previewContext, 
                    previousPoint.x, 
                    previousPoint.y, 
                    e.canvasX, 
                    e.canvasY, 
                    this.lineWidth, 
                    color.getForegroundColorAsRgb(),
                    false);
            }
        };
    }

    getName() {
        return 'Ellipse Tool';
    }

    getDescription() {
        return 'Draw with the mouse';
    }

    getButtonCssClass() {
        return 'ellipse-tool-button';
    }
    
    getToolOptions() {
        return [
            new ToolOption({
                cssClass: ['ellipse-plugin-option', 'ep-border'], 
                defaultEventHandler: () => this.mode = EllipseTool.BORDER
            }),
            new ToolOption({
                cssClass: ['ellipse-plugin-option', 'ep-border', 'ep-fill'], 
                defaultEventHandler: () => this.mode = EllipseTool.BORDER | EllipseTool.FILL
            }),
            new ToolOption({
                cssClass: ['ellipse-plugin-option', 'ep-fill'], 
                defaultEventHandler: () => this.mode = EllipseTool.FILL
            })
        ]
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

// Enums
EllipseTool.BORDER = 1;
EllipseTool.FILL = 2;

class EllipsePlugin extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['ellipse.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new EllipseTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.EllipsePlugin = EllipsePlugin;