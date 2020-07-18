const ENUM_DIR_HORIZONTAL = 1;
const ENUM_DIR_VERTICAL = 2;

/**
 * Represents the drawing areay of the application
 */
class DrawingArea extends EventEmitter {
    constructor(htmlElement) {
        super(); 

        this.htmlElement = htmlElement;

        this.scale = {x: 1.0, y: 1.0};
        // Always the PIXEL size. Actual element size = size * scale
        this.size = {x: 600, y: 400};

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

    /**
     * Returns the logical size of the drawig area.
     * Note that to get the *physical* size of the area, the size
     * will have to be multiplied by the scale
     */
    getSize () {
        return {
            width: this.size.x,
            height: this.size.y
        }
    }

    /**
     * Sets the logical size of the drawing area.
     * The *physical* size of the area is calculated by first multiplying with the 
     * scale and then rounding down to the nearest integer
     * @param {Number} width Logical width of the drawing area 
     * @param {Number} height Logical height of the drawing area 
     * @param {Boolean} final (optional) Flag that indicates if this resize is part of an ongoing drag operation 
     */
    setSize (width, height, final = false) {
        this.htmlElement.style.width = `${(width * this.scale.x) | 0}px`;
        this.htmlElement.style.height = `${(height * this.scale.y) | 0}px`;

        this.size.x = width;
        this.size.y = height;

        if (final) {
            this.emitEvent('sizeupdateend', {width: width, height: height}); 
        } else {
            this.emitEvent('sizeupdate', {width: width, height: height}); 
        }
    }

    /**
     * Sets the scale of the drawing area.
     * Note: The scale should always be a multiple of two (1, 2, 4, 8, 16, ...) to prevent
     * the image being antialiased or looking strange
     * @param {Number} x Horizontal scale 
     * @param {Number} y Vertical scale
     */
    setScale (x, y) {
        this.scale.x = x;
        this.scale.y = y;

        this.setSize(this.size.x, this.size.y, true);

        this.emitEvent('scaleupdate', this.scale);
    }

    /**
     * Returns the scale
     */
    getScale () {
        return this.scale;
    }
};

/**
 * Class that handles all the canvas elements inside the
 * drawing area.
 * 
 * Basic idea is to always have 3 canvases:
 * 1. Buffer 1
 * 2. Buffer 2
 * 3. Preview
 * 
 * During resize, canvases get cleared. Therefore we just have two
 * canvases, flipping/copying values after each resize.
 * 
 * All drawing operations are done on the preview canvas. This is to have
 * easier undo/redo capabilities.
 */
class DrawingCanvas extends EventEmitter {
    constructor(drawingArea) {
        super();

        this.drawingArea = drawingArea;
        this.cvs = [ 
            // Element for buffer 1
            document.createElement('canvas'),
            // Element for buffer 2  
            document.createElement('canvas'),
            // Preview canvas 
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
            const event = { canvasX: coords.x, canvasY: coords.y, originalEvent: e };

            this.emitEvent('mousemove', event);
        };

        this.canvasMouseUpHandler = (e) => {
            document.removeEventListener('mousemove', this.canvasMouseMoveHandler);
            document.removeEventListener('mouseup', this.canvasMouseUpHandler);

            const coords = this.clientCoordToCanvasCoords({x: e.clientX, y: e.clientY});
            const event = { canvasX: coords.x, canvasY: coords.y, originalEvent: e };

            this.emitEvent('mouseup', event);
        };

        this.canvasMouseDownHandler = (e) => {
            document.addEventListener('mousemove', this.canvasMouseMoveHandler, false);
            document.addEventListener('mouseup', this.canvasMouseUpHandler, false);

            const coords = this.clientCoordToCanvasCoords({x: e.clientX, y: e.clientY});
            const event = { canvasX: coords.x, canvasY: coords.y, originalEvent: e };

            this.emitEvent('mousedown', event);
        };

        this.cvs.forEach((e) => e.addEventListener('mousedown', this.canvasMouseDownHandler, false));
    }

    /**
     * Method that maps client coordinates (eg. from a mouse event) to canvas coordinates,
     * including scale, scroll etc.
     * @param {{x: Number, y: Number}} coords 
     */
    clientCoordToCanvasCoords(coords) {
        const rect = this.htmlElement.getBoundingClientRect();
        return {
            x: (coords.x - rect.left) / this.drawingArea.scale.x,
            y: (coords.y - rect.top) / this.drawingArea.scale.y
        }
    }

    /**
     * Set all canvases to a new logical size
     * @param {{width: Number, height: Number}} size 
     */
    setSize(size = null) {
        this.setRawCanvasSize(this.inactive, size);
        this.setRawCanvasSize(this.preview, size);
        this.swapActive();
    }

    /**
     * Set the canvas with the given index to the logical size and scale given
     * by the parameters. Element size is calculated by multiplying size with scale and then
     * rounding down to the next integer. 
     * @param {Number} index 
     * @param {{width: Number, height: Number}} size 
     * @param {{x: Number, y: Number}} scale 
     */
    setRawCanvasSize(index, size = null, scale = null) {
        if (!size) {
            size = this.drawingArea.getSize();
        }

        if (!scale) {
            scale = this.drawingArea.getScale();
        }

        this.cvs[index].width = size.width | 0;
        this.cvs[index].height = size.height | 0;
        this.cvs[index].style.width = size.width * scale.x | 0;
        this.cvs[index].style.height = size.height * scale.y | 0;
    }

    /**
     * Copy the currently active canvas to the currently inavtive and then 
     * make the inavtive the active canvas (buffer swap)
     */
    swapActive() {
        this.copyActiveToInactive();

        const oldActive = this.active;
        this.active = this.inactive;
        this.inactive = oldActive;

        this.drawingArea.htmlElement.removeChild(this.cvs[this.inactive]);
        this.drawingArea.htmlElement.appendChild(this.cvs[this.active]);
    }

    /**
     * Copies the active canvas content to the inavtive canvas
     */
    copyActiveToInactive() {
        const active = this.cvs[this.active];
        const inactive = this.cvs[this.inactive];
        // Copy image data
        inactive.getContext('2d').drawImage(active, 0, 0);
    }

    /**
     * Draw the preview canvas's content onto the active canvas and
     * clear the preview canvas
     */
    applyPreview() {
        const preview = this.cvs[this.preview];
        this.context.drawImage(preview, 0, 0);
        this.clearPreview();
    }

    /**
     * Clear the preview canvas
     */
    clearPreview() {
        const preview = this.cvs[this.preview];
        preview.getContext('2d').clearRect(0, 0, preview.width, preview.height);
    }

    /**
     * The html element for the currently active canvas
     */
    get htmlElement() {
        return this.cvs[this.active];
    }

    /**
     * The 2d drawing context of the currently active canvas.
     * 
     * Note: Drawing tools should always use previewContext instead and then
     * composite using applyPreview()
     */
    get context() {
        return this.cvs[this.active].getContext('2d');
    }

    /**
     * The 2d drawing context of the preview canvas
     */
    get previewContext() {
        return this.cvs[this.preview].getContext('2d');
    }
}

/**
 * Resizer handle
 */
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
                (this.originalSize.width + deltaWidth) / drawingArea.scale.x, 
                (this.originalSize.height + deltaHeight) / drawingArea.scale.y,
                true
            );
        };

        const mouseMoveEventHandler = (e) => {
            const deltaWidth = (this.resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - this.originalMousePos.x : 0;
            const deltaHeight = (this.resizerType & ENUM_DIR_VERTICAL) ? e.clientY - this.originalMousePos.y : 0;
            
            this.drawingArea.setSize(
                (this.originalSize.width + deltaWidth) / drawingArea.scale.x,
                (this.originalSize.height + deltaHeight) / drawingArea.scale.y,
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