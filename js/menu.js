const ENUM_MENUPOSITION_BOTTOM = 1;
const ENUM_MENUPOSITION_RIGHT = 2;

class MenuItem extends EventEmitter {

    static menuItemIdCounter = 0;

    constructor(name) {
        super();

        this.name = name;
        this.active = false;
        this.children = [];
        this.menuItemId = `menu-item-${this.menuItemIdCounter++}`;
    }

    getName() {
        return this.name;
    }

    getChildren() {
        return this.children;
    }

    hasChildren() {
        return this.children.length > 0;
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

        let fileMenu = new MenuItem('File');
        fileMenu.addChild(new MenuItem('About'));
        fileMenu.addChild(new MenuItem('Save...'));
        fileMenu.addChild(new MenuItem('Exit'));
        this.menuRoot.addChild(fileMenu);

        this.menuRoot.addChild(new MenuItem('Edit'));

        let zoomMenu = new MenuItem('Zoom');
        zoomMenu.addChild(new MenuItem('100%'));
        zoomMenu.addChild(new MenuItem('125%'));
        zoomMenu.addChild(new MenuItem('150%'));
        zoomMenu.addChild(new MenuItem('200%'));

        let viewMenu = new MenuItem('View');
        viewMenu.addChild(new MenuItem('Foo'));
        viewMenu.addChild(new MenuItem('Bar'));
        viewMenu.addChild(zoomMenu);
        viewMenu.addChild(new MenuItem('Foobar'));
        this.menuRoot.addChild(viewMenu);

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

        // Event handler for clicking on the item
        const childClickEventHandler = (e) => {
            if(child.isActive()) {
                child.setActive(false);
                // We are now deactivated, so we don't need the global event handler any more, since
                // we only want a click directly on the element to activate it again
                document.removeEventListener('click', childClickEventHandler);
            } else {
                child.setActive(true);

                // When active, we want a click anywhere in the window to deactivate the item
                // Also, we have to do this in a timeout so that this even does not get bubbled up
                // to the new deven listener we just attached.
                // Also, stoping event propagation is not an option since we might need to trigger
                // other event handlers (like for other active elements), so this is the safest option
                setTimeout(() => document.addEventListener('click', childClickEventHandler, false));
            }
        }

        // Attach event handler to the element
        el.addEventListener('click', childClickEventHandler, false);

        // Event handler for state changes
        child.addEventListener('activechange', (_, active) => {
            if(active) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Initialize sub menus
        new Menu(child, el, ENUM_MENUPOSITION_BOTTOM);
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
    constructor(menuItem, parentHtmlElement, menuPosition) {
        this.parentHtmlElement = parentHtmlElement;
        this.menuItem = menuItem;
        this.menuPosition = menuPosition;

        this.htmlElement = document.createElement('div');
        this.htmlElement.classList.add('menu');
        this.htmlElement.classList.add((this.menuPosition == ENUM_MENUPOSITION_BOTTOM)? 'menu-bottom' : 'menu-right');
        this.parentHtmlElement.appendChild(this.htmlElement);

        this.childElements = {};

        this.menuItem.addEventListener('activechange', (_, e) => this.menuItemActiveChange(e));
        this.menuItem.addEventListener('addchild', (_, c) => this.addChild(c));
        this.menuItem.addEventListener('removeChild', (_, c) => this.removeChild(c));

        // Initial setup for children
        this.menuItem.getChildren().forEach((c) => this.addChild(c));
        // Initial active state
        this.menuItemActiveChange(this.menuItem.isActive());
    }

    menuItemActiveChange(active) {
        // Only show the menu if the item actually has children
        if(active && this.menuItem.hasChildren()) {
            this.htmlElement.classList.add('active');
        } else {
            this.htmlElement.classList.remove('active');
        }
    }

    addChild(child) {
        const el = document.createElement('div');
        el.innerText = child.getName();
        el.classList.add('menu-item');
        el.onmouseover = () => child.setActive(true);
        el.onmouseout = () => child.setActive(false);
        this.htmlElement.appendChild(el);
        this.childElements[child.getId()] = el;

        new Menu(child, el, ENUM_MENUPOSITION_RIGHT);
    }

    removeChild(child) {
        const el = this.childElements[child.getId()];
        if(el) {
            this.htmlElement.removeChild(el);
            delete this.childElements[child.getId()];
        } else {
            console.warn('[Menu]: Attempting to remove child that does not exist', child);
        }
    }
}