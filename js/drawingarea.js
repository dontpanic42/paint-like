class DrawingArea {
    constructor(htmlElement) {
        this.htmlElement = htmlElement;

        this.resizers = [
            // Bottom right resizer
            new DrawingAreaResizer(this, ENUM_DIR_HORIZONTAL | ENUM_DIR_VERTICAL, htmlElement.querySelector('.br-resizer')),
            // Right resizer
            new DrawingAreaResizer(this, ENUM_DIR_HORIZONTAL, htmlElement.querySelector('.r-resizer')),
            // Bottom resizer
            new DrawingAreaResizer(this, ENUM_DIR_VERTICAL, htmlElement.querySelector('.b-resizer'))
        ].forEach((r) => r.addEventListener('sizeupdate', (w, h) => this.setSize(w, h)));
    }

    getSize () {
        return {
            width: this.htmlElement.clientWidth,
            height: this.htmlElement.clientHeight
        }
    }

    setSize (width, height) {
        this.htmlElement.style.width = `${width}px`;
        this.htmlElement.style.height = `${height}px`; 
    }
};

class DrawingAreaResizer extends EventEmitter {
    constructor(drawingArea, resizerType, htmlElement) {
        super();

        this.drawingArea = drawingArea;
        this.resizerType = resizerType;
        this.htmlElement = htmlElement;

        const mouseUpEventHandler = (e) => {
            document.removeEventListener('mousemove', mouseMoveEventHandler);
            document.removeEventListener('mouseup', mouseUpEventHandler);

            const deltaWidth = (this.resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - this.originalMousePos.x : 0;
            const deltaHeight = (this.resizerType & ENUM_DIR_VERTICAL) ? e.clientY - this.originalMousePos.y : 0;

            this.emitEvent(
                'sizeupdateend', 
                this.originalSize.width + deltaWidth, 
                this.originalSize.height + deltaHeight
            );
        };

        const mouseMoveEventHandler = (e) => {
            const deltaWidth = (this.resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - this.originalMousePos.x : 0;
            const deltaHeight = (this.resizerType & ENUM_DIR_VERTICAL) ? e.clientY - this.originalMousePos.y : 0;
            
            this.emitEvent(
                'sizeupdate',
                this.originalSize.width + deltaWidth,
                this.originalSize.height + deltaHeight
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