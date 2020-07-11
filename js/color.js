class ColorManager extends EventEmitter {
    constructor() {
        super();
    }

    getForegroundColor() {
        return 'rgba(255, 255, 255, 1.0)';
    }

    getBackgroundColor() {
        return 'rgba(0, 0, 0, 1.0)';
    }
}