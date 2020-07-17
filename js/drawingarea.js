const ENUM_DIR_HORIZONTAL = 1;
const ENUM_DIR_VERTICAL = 2;

class DrawingArea extends EventEmitter {
    constructor(htmlElement) {
        super(true); 

        this.htmlElement = htmlElement;

        this.scale = {x: 1.0, y: 1.0};

        this.canvas = new DrawingCanvas(this);

        this.resizers = [
            // Bottom right resizer
            new DrawingAreaResizer(this, ENUM_DIR_HORIZONTAL | ENUM_DIR_VERTICAL, htmlElement.querySelector('.br-resizer')),
            // Right resizer
            new DrawingAreaResizer(this, ENUM_DIR_HORIZONTAL, htmlElement.querySelector('.r-resizer')),
            // Bottom resizer
            new DrawingAreaResizer(this, ENUM_DIR_VERTICAL, htmlElement.querySelector('.b-resizer'))
        ];
    }

    getSize () {
        return {
            width: this.htmlElement.clientWidth,
            height: this.htmlElement.clientHeight
        }
    }

    setSize (width, height, final = false) {
        this.htmlElement.style.width = `${width * this.scale.x}px`;
        this.htmlElement.style.height = `${height * this.scale.y}px`;

        if (final) {
            this.emitEvent('sizeupdateend', {width: width, height: height}); 
        } else {
            this.emitEvent('sizeupdate', {width: width, height: height}); 
        }
    }

    setScale (x, y) {
        this.scale.x = x;
        this.scale.y = y;

        this.emitEvent('scaleupdate', this.scale);
    }

    getScale () {
        return this.scale;
    }
};

class DrawingCanvas extends EventEmitter {
    constructor(drawingArea) {
        super();

        this.drawingArea = drawingArea;
        this.cvs = [ 
            document.createElement('canvas'),  
            document.createElement('canvas'), 
            document.createElement('canvas') 
        ];

        this.active = 0;
        this.inactive = 1;
        this.preview = 2;

        this.drawingArea.htmlElement.appendChild(this.cvs[this.active]);
        this.drawingArea.htmlElement.appendChild(this.cvs[this.preview]);

        this.setRawCanvasSize(this.active, this.drawingArea.getSize());
        this.setRawCanvasSize(this.preview, this.drawingArea.getSize());

        this.drawingArea.addEventListener('sizeupdateend', (s) => this.setSize(s));
        this.drawingArea.addEventListener('scaleupdate', () => this.setSize());

        this.canvasMouseMoveHandler = (e) => {

            const coords = this.clientCoordToCanvasCoords({x: e.clientX, y: e.clientY});
            const event = {
                canvasX: coords.x,
                canvasY: coords.y,
                originalEvent: e
            };

            this.emitEvent('mousemove', event);
        };

        this.canvasMouseUpHandler = (e) => {
            document.removeEventListener('mousemove', this.canvasMouseMoveHandler);
            document.removeEventListener('mouseup', this.canvasMouseUpHandler);

            const coords = this.clientCoordToCanvasCoords({x: e.clientX, y: e.clientY});
            const event = {
                canvasX: coords.x,
                canvasY: coords.y,
                originalEvent: e
            };

            this.emitEvent('mouseup', event);
        };

        this.canvasMouseDownHandler = (e) => {
            document.addEventListener('mousemove', this.canvasMouseMoveHandler, false);
            document.addEventListener('mouseup', this.canvasMouseUpHandler, false);

            const coords = this.clientCoordToCanvasCoords({x: e.clientX, y: e.clientY});
            const event = {
                canvasX: coords.x,
                canvasY: coords.y,
                originalEvent: e
            };

            this.emitEvent('mousedown', event);
        };

        this.cvs.forEach((e) => e.addEventListener('mousedown', this.canvasMouseDownHandler, false));
    }

    clientCoordToCanvasCoords(coords) {
        const rect = this.htmlElement.getBoundingClientRect();
        return {
            x: (coords.x - rect.left) / this.drawingArea.scale.x,
            y: (coords.y - rect.top) / this.drawingArea.scale.y
        }
    }

    setSize(size = null) {
        this.setRawCanvasSize(this.inactive, size);
        this.setRawCanvasSize(this.preview, size);
        this.swapActive();
    }

    setRawCanvasSize(index, size = null, scale = null) {
        if (!size) {
            size = this.drawingArea.getSize();
        }

        if (!scale) {
            scale = this.drawingArea.getScale();
        }

        this.cvs[index].width = size.width;
        this.cvs[index].height = size.height;
        this.cvs[index].style.width = size.width * scale.x;
        this.cvs[index].style.height = size.height * scale.y;
    }

    swapActive() {
        this.copyActiveToInactive();

        const oldActive = this.active;
        this.active = this.inactive;
        this.inactive = oldActive;

        this.drawingArea.htmlElement.removeChild(this.cvs[this.inactive]);
        this.drawingArea.htmlElement.appendChild(this.cvs[this.active]);
    }

    copyActiveToInactive() {
        const active = this.cvs[this.active];
        const inactive = this.cvs[this.inactive];
        // Copy image data
        inactive.getContext('2d').drawImage(active, 0, 0);
    }

    applyPreview() {
        const preview = this.cvs[this.preview];
        this.context.drawImage(preview, 0, 0);
        this.clearPreview();
    }

    clearPreview() {
        const preview = this.cvs[this.preview];
        preview.getContext('2d').clearRect(0, 0, preview.width, preview.height);
    }

    get htmlElement() {
        return this.cvs[this.active];
    }

    get context() {
        return this.cvs[this.active].getContext('2d');
    }

    get previewContext() {
        return this.cvs[this.preview].getContext('2d');
    }
}

class DrawingAreaResizer {
    constructor(drawingArea, resizerType, htmlElement) {
        this.drawingArea = drawingArea;
        this.resizerType = resizerType;
        this.htmlElement = htmlElement;

        const mouseUpEventHandler = (e) => {
            document.removeEventListener('mousemove', mouseMoveEventHandler);
            document.removeEventListener('mouseup', mouseUpEventHandler);

            const deltaWidth = (this.resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - this.originalMousePos.x : 0;
            const deltaHeight = (this.resizerType & ENUM_DIR_VERTICAL) ? e.clientY - this.originalMousePos.y : 0;

            this.drawingArea.setSize(
                this.originalSize.width + deltaWidth, 
                this.originalSize.height + deltaHeight,
                true
            );
        };

        const mouseMoveEventHandler = (e) => {
            const deltaWidth = (this.resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - this.originalMousePos.x : 0;
            const deltaHeight = (this.resizerType & ENUM_DIR_VERTICAL) ? e.clientY - this.originalMousePos.y : 0;
            
            this.drawingArea.setSize(
                this.originalSize.width + deltaWidth,
                this.originalSize.height + deltaHeight,
                false
            );
        };

        htmlElement.onmousedown = (e) => {
            this.originalSize = this.drawingArea.getSize();
            this.originalMousePos = {x: e.clientX, y: e.clientY};

            document.addEventListener('mousemove', mouseMoveEventHandler, false);
            document.addEventListener('mouseup', mouseUpEventHandler, false);
        };
    }
};