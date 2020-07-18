/**
 * A selection of functions that are usefull for working with raw image data
 */
const AlgoLibImageDataHelper = {

    /**
     * Returns the color of a given pixel in given image data
     * @param {ImageData} data The image data to get the value from
     * @param {Number} x
     * @param {Number} y
     */
    getColor: (data, x, y) => {
        const offset = (y * data.width + x) << 2;
        return [
            data.data[offset], 
            data.data[offset+1], 
            data.data[offset+2]
        ];
    },

    /**
     * Set color of a given pixel in given image data
     * @param {ImageData} data The image data to work on
     * @param {Number} x
     * @param {Number} y
     * @param {Array} color The color to set the pixel to
     */
    setColor: (data, x, y, [r, g, b]) => {
        const offset = (y * data.width + x) << 2;
        data.data[offset  ] = r;
        data.data[offset+1] = g;
        data.data[offset+2] = b;
        data.data[offset+3] = 255;
    },

    /**
     * Returns whether or not two give arrays containing r,g and b values
     * are equal
     * @param {Array} a Color 1
     * @param {Array} b Color 2
     */
    colorIsEqual: (a, b) => {
        return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
    }
}

/**
 * Class that contains shared drawing algorithms.
 * 
 * Most of the algorithms found here are adapted from
 * Zingl Alois 'easyfilter' lib, 
 * @see http://members.chello.at/easyfilter/bresenham.js
 */
class AlgoLib {

    /**
     * Draws a single 'pixel' (or more correct: Rectangle) of a given size
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} x0 Left coordinate 
     * @param {Number} y0 Top coordinate
     * @param {Number} width Size of the pixel to draw
     * @param {Array} color Color of the pixel to draw
     */
    putPixel(ctx, x0, y0, width, color) {
        const {setColor} = AlgoLibImageDataHelper;
        const data = ctx.getImageData(x0, y0, width, width);

        for(let x = 0; x < width; x++) {
            for(let y = 0; y < width; y++) {
                setColor(data, x, y, color)
            }
        }

        ctx.putImageData(data, x0, y0);
    }

    /**
     * Does flood fill on a given context, based on the existing data in a reference context
     * @param {CanvasRenderingContext2D} ctxTag Context of the canvas to render to 
     * @param {CanvasRenderingContext2D} ctxRef Context of the canvas used as fill reference
     * @param {*} x0 Left coordinate  
     * @param {*} y0 Top coordinate
     * @param {Array} color Color as RGB array 
     */
    floodFill(ctxTag, ctxRef, x0, y0, color) {
        // Import some helpers that make it easier to work with raw image data
        const {setColor, getColor, colorIsEqual} = AlgoLibImageDataHelper;
        // Get the dimensions of the canvas
        const {width, height} = ctxRef.canvas;

        if(width > 0xFFFF || height > 0xFFFF) {
            console.warn(`[AlgoLib]: Image size exceeds ${0xFFFF}x${0xFFFF}px, cannot completely fill`);
        }

        // Get the raw image data from the reference. This creates a copy, so we
        // can override it later without worrying about modifying the original
        const data = ctxRef.getImageData(0, 0, width, height)
        // Get the reference color, ie. the color of the pixel we stared with
        const refColor = getColor(data, x0, y0);
        // If the pixel we started with already has the same color as the fill color...
        if(colorIsEqual(refColor, color)) {
            // ... return immediately
            return;
        }

        // Prepare the stack. We knowingly overprovision... oh well , better than
        // having to allocated later
        const stack = new Array(width * height * 2);
        // First entry on the stack: The starting coordinates. To save on memory/
        // stack operations, we pack the corrdinates in a 32 bit field, with the upper
        // 16 bit being y, the lower 16 bit x
        stack[0] = x0 + (y0 << 16);

        // We loop over the stack until the stack pointer is < 0
        for(let sp = 0; sp >= 0;) {
            // x value is the lower 16bit. And'ing with 0xFFFF ensures a positive value
            const x = stack[sp  ] & 0xFFFF;
            // y value is the upper 16bit. And'ing with 0xFFFF ensures a positive value
            const y = stack[sp--] >> 16 & 0xFFFF;

            // Check if out of range. No gegative check required since we And with 0xFFFF before
            if(x >= width || y >= height) {
                // Out of range, ignore value
                continue;
            }

            // Only proceed if the current pxiels color is the same as the one we started with
            // (our reference color)
            if(colorIsEqual(refColor, getColor(data, x, y))) {

                // Colorize the pixel with the fill color
                setColor(data, x, y, color);
                // Add all surrounding pixels to the list
                stack[++sp] = (x + 1) + ((y) << 16);
                stack[++sp] = (x - 1) + ((y) << 16);
                stack[++sp] = x + ((y + 1) << 16);
                stack[++sp] = x + ((y - 1) << 16);
            }
        }

        // Copy the reference data we were working with to the target context
        ctxTag.putImageData(data, 0, 0);
    }

    /**
     * Draw a line using bresenham's algorithm. 
     * Other than the canvas native lineTo function, this gives the same pixelated
     * result that can be found in the original paint application
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Number} x0 Start left coordinate
     * @param {Number} y0 Start top coordinate
     * @param {Number} x1 End left coordinate
     * @param {Number} y1 End top coordinate
     * @param {Number} linewidth Width of the line to draw
     * @param {Array} color Color of the line to draw
     */
    drawLine(ctx, x0, y0, x1, y1, linewidth, color) {
        x0 = x0 | 0;
        y0 = y0 | 0;
        x1 = x1 | 0;
        y1 = y1 | 0;

        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        let e2;

        while(x0 != x1 || y0 != y1) {
            this.putPixel(ctx, x0, y0, linewidth, color);
            e2 = 2 * err;
            if (e2 >= dy) {
                err += dy; 
                x0 += sx;
            }

            if (e2 <= dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
}