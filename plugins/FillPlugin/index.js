class FillTool extends Tool {
    constructor(appManager) {
        super();

        const appCore = appManager.core;
        const canvas = this.canvas = appCore.drawingArea.canvas;
        const color = appCore.colorManager;
        const history = appCore.historyManager;
        const algoLib = appManager.util.algoLib;

        this.mouseDownEventHandler = ({canvasX, canvasY}) => {
            // Get the main context - will be used as reference on where to fill
            // and where not to fill
            const ctxMain = canvas.context;
            // Get preview context - we will actually put the color here
            const ctxPrev = canvas.previewContext;
            // Use the foreground color as fill color
            const fillColor = color.getForegroundColorAsRgb();
            // Do the flood fill using AlgoLib's flood fill algorithm
            algoLib.floodFill(ctxPrev, ctxMain, canvasX, canvasY, fillColor);
            // Apply the preview and add a history entry
            history.helper.historizedApplyPreview(canvas, `Fill with ${this.getName()}`);
        };
    }

    getName() {
        return 'Fill';
    }

    getDescription() {
        return 'Fill an area with color';
    }

    getButtonCssClass() {
        return 'fill-tool-button';
    }

    // Called when the tool was selected by the user
    onActivate() {
        this.canvas.addEventListener('mousedown', this.mouseDownEventHandler);
    }

    // Called when another tool was selected by the user
    onDeactivate() {
        this.canvas.removeEventListener('mousedown', this.mouseDownEventHandler);
    }
}

class FillPlugin extends Plugin {
    constructor() {
        super();
    }

    getResources() {
        return { 
            css: ['fill.css']
        };
    }

    init() {
        const appCore = this.getAppManager().core;

        appCore.toolManager.addTool(new FillTool(this.getAppManager()));
    }
}

// Register plugin in plugin registry
window.plugins.FillPlugin = FillPlugin;