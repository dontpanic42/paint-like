class ColorManager extends EventEmitter {
    constructor() {
        super(false);

        this.palette = [
            [0,255,255],
            [0,0,0],
            [0,0,255],
            [255,0,255],
            [0,128,0],
            [0,255,0],
            [128,0,0],
            [0,0,128],
            [128,128,0],
            [128,0,128],
            [255,0,0],
            [192,192,192],
            [0,128,128],
            [255,255,255],
            [255,255,0],
        ];

        this.selectedForegroundColor = 1;
        this.selectedBackgroundColor = 14;
    }

    getForegroundColor() {
        return this.getPaletteColorAsString(this.selectedForegroundColor);
    }

    getBackgroundColor() {
        return this.getPaletteColorAsString(this.selectedBackgroundColor);
    }

    setForegroundColor(index) {
        this.selectedForegroundColor = index;
        this.emitEvent('setforegroundcolor', index, this.palette[index], this.getPaletteColorAsString(index));
    }

    setBackgroundColor(index) {
        this.selectedBackgroundColor = index;
        this.emitEvent('setbackgroundcolor', index, this.palette[index], this.getPaletteColorAsString(index));
    }

    setPaletteColor(index, rgb) {
        this.palette[index] = rgb;
        this.emitEvent('paletteupdate', index, rgb, this.getPaletteColorAsString(index));
    }

    getPaletteColor(index) {
        return this.palette[index];
    }

    getPaletteColorAsString(index) {
        return `rgba(${this.palette[index][0]}, ${this.palette[index][1]}, ${this.palette[index][2]}, 1.0)`;
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

    updatePreview() {
        this.htmlElementFg.style.backgroundColor = this.colorManager.getForegroundColor();
        this.htmlElementBg.style.backgroundColor = this.colorManager.getBackgroundColor();
    }
}