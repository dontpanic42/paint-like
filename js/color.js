
class ColorManager extends EventEmitter {
    constructor() {
        super(false);

        // Defautl color palette
        this.palette = [
            [   0,   0,   0], [ 255, 255, 255],
            [ 128, 128, 128], [ 192, 192, 192],
            [ 128,   0,   0], [ 255,   0,   0], 
            [ 128, 128,   0], [ 255, 255,   0], 
            [   0, 128,   0], [   0, 255,   0],
            [   0, 128, 128], [   0, 255, 255],  
            [   0,   0, 128], [   0,   0, 255],
            [ 128,   0, 128], [ 255,   0, 255], 
            [ 128, 128,  64], [ 255, 255, 128],
            [   0,  64,  64], [   0, 255, 128],
            [   0, 128, 255], [ 128, 255, 255], 
            [   0,  64, 128], [ 128, 128, 255],
            [ 128,   0, 255], [ 255,   0, 128], 
            [ 128,  64,   0], [ 255, 128,  64]
        ];

        // Index of the currently selected foreground color 
        // Default = Black
        this.selectedForegroundColor = 0;
        // Index of the currently selected background color
        // Default = White
        this.selectedBackgroundColor = 1;
    }

    /**
     * Returns the current foreground color as css rgb string
     */
    getForegroundColor() {
        return this.getPaletteColorAsString(this.selectedForegroundColor);
    }

    /**
     * Returns the current foreground color as an array of r, g and b values
     */
    getForegroundColorAsRgb() {
        return this.palette[this.selectedForegroundColor];
    }

    /**
     * Returns the current background color as css rgb string
     */
    getBackgroundColor() {
        return this.getPaletteColorAsString(this.selectedBackgroundColor);
    }

    /**
     * Returns the current background color as an array of r, g and b values
     */
    getBackgroundColorAsRgb() {
        return this.palette[this.selectedBackgroundColor];
    }

    /**
     * Sets the current foreground color
     * @param {int} index Palette index of the color
     */
    setForegroundColor(index) {
        this.selectedForegroundColor = index;
        this.emitEvent('setforegroundcolor', index, this.palette[index], this.getPaletteColorAsString(index));
    }

    /**
     * Sets the current background color
     * @param {int} index Palette index of the color
     */
    setBackgroundColor(index) {
        this.selectedBackgroundColor = index;
        this.emitEvent('setbackgroundcolor', index, this.palette[index], this.getPaletteColorAsString(index));
    }

    /**
     * Sets a color of the palette as r, g and b values
     * @param {int} index Index of the color to modify
     * @param {Array} rgb array of r, g and b values
     */
    setPaletteColor(index, rgb) {
        this.palette[index] = rgb;
        this.emitEvent('paletteupdate', index, rgb, this.getPaletteColorAsString(index));
    }

    /**
     * Returns a color of the palette as array of r, g and b values
     * @param {int} index Index of the color to return
     */
    getPaletteColor(index) {
        return this.palette[index];
    }

    /**
     * Returns a color of the palette as css rgb string
     * @param {int} index Index of the color to return
     */
    getPaletteColorAsString(index) {
        const [r, g, b] = this.palette[index];
        return `rgba(${r}, ${g}, ${b}, 1.0)`;
    }
}

class ColorBar {
    constructor(colorManager, htmlElement) {
        this.htmlElement = htmlElement;
        this.htmlElementTop = htmlElement.querySelector('.palette-top');
        this.htmlElementBottom = htmlElement.querySelector('.palette-bottom');
        this.colorManager = colorManager;

        this.boxes = [];

        this.colorManager.palette.forEach((_, index) => this.addColor(index));
    }

    /**
     * Adds a color to the color bar
     * @param {int} index 
     */
    addColor(index) {
        const parent = (index % 2 == 0)? this.htmlElementTop : this.htmlElementBottom;

        const element = document.createElement('div');
        element.style.backgroundColor = this.colorManager.getPaletteColorAsString(index);
        element.onclick = () => { this.colorManager.setForegroundColor(index); };
        element.oncontextmenu = () => {this.colorManager.setBackgroundColor(index); return false;};
        parent.appendChild(element);

        this.boxes[index] = element;
    }
}

class ColorPreview {
    constructor(colorManager, htmlElementFg, htmlElementBg) {
        this.htmlElementFg = htmlElementFg;
        this.htmlElementBg = htmlElementBg;
        this.colorManager = colorManager;

        this.colorManager.addEventListener('setforegroundcolor', () => this.updatePreview());        
        this.colorManager.addEventListener('setbackgroundcolor', () => this.updatePreview());   
        
        this.updatePreview();
    }

    /**
     * Updates the preview to the current foreground and background colors
     */
    updatePreview() {
        this.htmlElementFg.style.backgroundColor = this.colorManager.getForegroundColor();
        this.htmlElementBg.style.backgroundColor = this.colorManager.getBackgroundColor();
    }
}