// Most of the algorithms found here are adapted from
// Zingl Alois 'easyfilter' lib, 
// @see http://members.chello.at/easyfilter/bresenham.js

class AlgoLib {
    putPixel(ctx, x0, y0, width, color) {
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(x0, y0, width, width);
    }

    // Draw a (pixelated, paint-like) line using bresenham's algorithm
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