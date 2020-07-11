const ENUM_DIR_HORIZONTAL = 1;
const ENUM_DIR_VERTICAL = 2;

class DrawingArea extends EventEmitter {
    constructor(htmlElement) {
        super(); 

        this.htmlElement = htmlElement;
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
        this.htmlElement.style.width = `${width}px`;
        this.htmlElement.style.height = `${height}px`;

        if (final) {
            this.emitEvent('sizeupdateend', {width: width, height: height}); 
        } else {
            this.emitEvent('sizeupdate', {width: width, height: height}); 
        }
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

        this.canvasMouseMoveHandler = (e) => {
            this.emitEvent('mousemove', e);
        };

        this.canvasMouseUpHandler = (e) => {
            document.removeEventListener('mousemove', this.canvasMouseMoveHandler);
            document.removeEventListener('mouseup', this.canvasMouseUpHandler);
            this.emitEvent('mouseup', e);
        };

        this.canvasMouseDownHandler = (e) => {
            document.addEventListener('mousemove', this.canvasMouseMoveHandler, false);
            document.addEventListener('mouseup', this.canvasMouseUpHandler, false);
            this.emitEvent('mousedown', e);
        };

        this.cvs.forEach((e) => e.addEventListener('mousedown', this.canvasMouseDownHandler, false));
    }

    setSize(size) {
        this.setRawCanvasSize(this.inactive, size);
        this.setRawCanvasSize(this.preview, size);
        this.swapActive();
    }

    setRawCanvasSize(index, size) {
        this.cvs[index].width = size.width;
        this.cvs[index].height = size.height;
        this.cvs[index].style.width = size.width;
        this.cvs[index].style.height = size.height;
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