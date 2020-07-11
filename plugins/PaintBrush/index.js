class PaintBrushTool extends Tool {
    constructor() {
        super();
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
        this.getAppManager().core.toolManager.addTool(new PaintBrushTool());
    }
}

// Register plugin in plugin registry
window.plugins.PaintBrush = PaintBrush;