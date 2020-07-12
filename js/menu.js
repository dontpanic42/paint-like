class MenuItem extends EventEmitter {

    static menuItemIdCounter = 0;

    constructor(name) {
        super();

        this.name = name;
        this.active = true;
        this.children = [];
        this.menuItemId = `menu-item-${this.menuItemIdCounter++}`;
    }

    getName() {
        return this.name;
    }

    getChildren() {
        return this.children;
    }

    addChild(child) {
        this.children.push(child);
        this.emitEvent('addchild', this, child);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if(index != -1) {
            this.children.splice(index, 1);
            this.emitEvent('removechild', this, child);
        }
    }

    isActive() {
        return this.active;
    }

    setActive(val) {
        if(val != this.active) {
            this.active = val;
            this.emitEvent('activechange', this, val);
        }
    }

    getId() {
        return this.menuItemId;
    }
}

class MenuManager {
    constructor() {
        this.menuRoot = new MenuItem('root');
        this.menuRoot.addChild(new MenuItem('File'));
        this.menuRoot.addChild(new MenuItem('Edit'));
        this.menuRoot.addChild(new MenuItem('View'));
        this.menuRoot.addChild(new MenuItem('Image'));
        this.menuRoot.addChild(new MenuItem('Colors'));
        this.menuRoot.addChild(new MenuItem('Help'));
    }

    getRoot() {
        return this.menuRoot;
    }
}

class MenuBar {
    constructor(menuManager, htmlElement) {
        this.menuManager = menuManager;
        this.htmlElement = htmlElement;
        this.elements = {};

        const root = this.menuManager.getRoot();

        root.getChildren().forEach((c) => this.addChild(c));
        root.addEventListener('addchild', (_, c) => this.addChild(c));
        root.addEventListener('removeChild', (_, c) => this.removeChild(c));
    }

    addChild(child) {
        const el = document.createElement('div');
        el.innerText = child.getName();
        el.classList.add('menu-bar-item');
        this.htmlElement.appendChild(el);
        this.elements[child.getId()] = el;
    }

    removeChild(child) {
        const el = this.elements[child.getId()];
        if(el) {
            this.htmlElement.removeChild(el);
            delete this.elements[child.getId()];
        } else {
            console.warn('[MenuBar]: Attempting to remove child that does not exist', child);
        }
    }
}

class Menu {

}