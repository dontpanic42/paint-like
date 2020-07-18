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
        this.htmlElement.style.width =  `${(width * this.scale.x) | 0}px`;
        this.htmlElement.style.height = `${(height * this.scale.y) | 0}px`;

        this.size.x = width;
        this.size.y = height;

        const eventType = final ? 'sizeupdateend' : 'sizeupdate';
        this.emitEvent(eventType, {width: width, height: height});
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
        this.canvas = { 
            // Element for buffer 1
            main: document.createElement('canvas'),
            // Preview canvas 
            preview: document.createElement('canvas') 
        };

        // Important: We need to ensure the preview is above the main in
        // the stack, so first add main, then preview
        this.drawingArea.htmlElement.appendChild(this.canvas.main);
        this.drawingArea.htmlElement.appendChild(this.canvas.preview);

        // Set initial size of the canvases
        this.setRawCanvasSize(this.drawingArea.getSize());

        this.drawingArea.addEventListener('sizeupdateend', (s) => this.setSize(s));
        this.drawingArea.addEventListener('scaleupdate', () => this.setSize());

        // Setup mouse event handlers on the preview canvas
        this.setupPreviewMouseEventHandlers();
    }

    /**
     * Sets up canvas event handlers. These are to be used by the drawing tools
     * to get a) normal mouse events and b) to get the events including
     * ready-made translated mouse coordinates
     */
    setupPreviewMouseEventHandlers() {

        /**
         * Wraps a MouseEvent object in another object, adding translated canvas 
         * coordinates to be used by drawing tools
         * @param {MouseEvent} originalEvent 
         */
        const wrapMouseEvent = (originalEvent) => {
            // Get coordinates of the canvas relative to client
            const {left, top} =    this.htmlElement.getBoundingClientRect();
            // Get the scale we are working on
            const {x: sx, y: sy} = this.drawingArea.getScale();

            return { 
                // Translate x coordinate of the mouse event to canvas coordinate system
                canvasX: (originalEvent.clientX - left) / sx, 
                // Translate y coordinate of the mouse event to canvas coordinate system
                canvasY: (originalEvent.clientY - top) / sy, 
                // Also pass the original event in case the tool needs it
                originalEvent 
            };
        }

        /**
         * Mouse move event handler
         * @param {MouseEvent} e 
         */
        const canvasMouseMoveHandler = (e) => {
            // Emit the wrapped mouse event
            this.emitEvent('mousemove', wrapMouseEvent(e));
        };

        /**
         * Mouse up event handler
         * @param {MouseEvent} e 
         */
        const canvasMouseUpHandler = (e) => {
            // Remove all the document event handlers since we are not interested
            // in mouse events that did not originate on our canvas
            document.removeEventListener('mousemove', canvasMouseMoveHandler);
            document.removeEventListener('mouseup', canvasMouseUpHandler);
            // Emit the wrapped mouse event
            this.emitEvent('mouseup', wrapMouseEvent(e));
        };

        // Set up canvas event handler. Since the tools are only expected to ever
        // interact with the preview canvas, that's where we put the event handlers
        this.canvas.preview.addEventListener('mousedown', (e) => {
            // We need to hook the document event handlers in case the user leaves
            // the canvas with the mouse. In that case, we still want to get
            // updates on the ongoing mouse action
            document.addEventListener('mousemove', canvasMouseMoveHandler, false);
            document.addEventListener('mouseup', canvasMouseUpHandler, false);
            // Emit the wrapped mouse event
            this.emitEvent('mousedown', wrapMouseEvent(e));
        }, false);
    }

    /**
     * Set all canvases to a new logical size
     * @param {{width: Number, height: Number}} size 
     */
    setSize(size = null) {
        const data = this.context.getImageData(0, 0, this.canvas.main.width, this.canvas.main.height);
        this.setRawCanvasSize(size);
        this.context.putImageData(data, 0, 0);
    }

    /**
     * Set the canvas with the given index to the logical size and scale given
     * by the parameters. Element size is calculated by multiplying size with scale and then
     * rounding down to the next integer. 
     * @param {Number} index 
     * @param {{width: Number, height: Number}} size 
     * @param {{x: Number, y: Number}} scale 
     */
    setRawCanvasSize(size = null, scale = null) {
        const {width, height}   = size  || this.drawingArea.getSize();
        const {x, y}            = scale || this.drawingArea.getScale();

        const m = this.canvas.main;
        const p = this.canvas.preview;

        // Set the inner size (resolution) of the canvas
        m.width  = p.width  = width  | 0;
        m.height = p.height = height | 0;
        // Set the outer size of the canvas (res*scale)
        m.style.width  = p.style.width  = (width * x)  | 0;
        m.style.height = p.style.height = (height * y) | 0;
    }

    /**
     * Draw the preview canvas's content onto the active canvas and
     * clear the preview canvas
     */
    applyPreview() {
        this.context.drawImage(this.canvas.preview, 0, 0);
        this.clearPreview();
    }

    /**
     * Clear the preview canvas
     */
    clearPreview() {
        this.previewContext.clearRect(0, 0, 
            this.canvas.preview.width, 
            this.canvas.preview.height);
    }

    /**
     * The html element for the currently active canvas
     */
    get htmlElement() {
        return this.canvas.main;
    }

    /**
     * The 2d drawing context of the currently active canvas.
     * 
     * Note: Drawing tools should always use previewContext instead and then
     * composite using applyPreview()
     */
    get context() {
        return this.canvas.main.getContext('2d');
    }

    /**
     * The 2d drawing context of the preview canvas
     */
    get previewContext() {
        return this.canvas.preview.getContext('2d');
    }
}

/**
 * Resizer handle
 */
class DrawingAreaResizer {
    constructor(drawingArea, resizerType, htmlElement) {

        // Holds the original mouse position at the start of the drag action
        const originalMousePos = {x: 0, y: 0};
        // Holds the original size at the start of the drag action
        let originalSize = undefined;

        /**
         * Takes a mouse event and updates the size of the drawing area based on this event
         * @param {MouseEvent} e The event based on which to calculate the size
         * @param {Boolean} final (optional) Flag that indicates that this is the final event
         */
        const updateSizeFromMouseEvent = (e, final = false) => {
            const deltaWidth = (resizerType & ENUM_DIR_HORIZONTAL) ? e.clientX - originalMousePos.x : 0;
            const deltaHeight = (resizerType & ENUM_DIR_VERTICAL) ? e.clientY - originalMousePos.y : 0;

            drawingArea.setSize(
                (originalSize.width + deltaWidth) / drawingArea.scale.x, 
                (originalSize.height + deltaHeight) / drawingArea.scale.y,
                final
            );
        }

        /**
         * Takes a mouse event and updates the size of the drawing area based on this event. Removes all related
         * mouse event handlers from the document
         * @param {MouseEvent} e 
         */
        const removeHandlerAndUpdateSizeFromMouseEvent = (e) => {
            document.removeEventListener('mousemove', updateSizeFromMouseEvent);
            document.removeEventListener('mouseup', removeHandlerAndUpdateSizeFromMouseEvent);
            updateSizeFromMouseEvent(e, true);
        };

        htmlElement.onmousedown = (e) => {
            originalSize = drawingArea.getSize();
            originalMousePos.x = e.clientX
            originalMousePos.y = e.clientY;

            document.addEventListener('mousemove', updateSizeFromMouseEvent, false);
            document.addEventListener('mouseup', removeHandlerAndUpdateSizeFromMouseEvent, false);
        };
    }
};