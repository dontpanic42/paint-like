const ENUM_MENUPOSITION_BOTTOM = 1;
const ENUM_MENUPOSITION_RIGHT = 2;

/**
 * Base class for menu items
 */
class MenuItem extends EventEmitter {

    /**
     * 
     * @param {string} name Human readable name of this item 
     * @param {string} id (Optional) unique id for this menu item. Auto generated if not given 
     */
    constructor(name, id = undefined) {
        super();

        this.name = name;
        this.active = false;
        this.enabled = true;
        this.children = [];
        this.onclick = onclick;
        this.menuItemId = id ? id : `menu-item-${MenuItem.menuItemIdCounter++}`;
    }

    /**
     * Return the human readable name of this item
     */
    getName() {
        return this.name;
    }

    /**
     * Returns an array of child items
     */
    getChildren() {
        return this.children;
    }

    /**
     * Returns true when this menu item has at least on child
     */
    hasChildren() {
        return this.children.length > 0;
    }

    /**
     * Adds a child to this menu item
     * @param {MenuItem} child 
     */
    addChild(child) {
        this.children.push(child);
        this.emitEvent('addchild', this, child);
    }

    /**
     * Removes a child element from this menu item
     * @param {MenuItem} child 
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if(index != -1) {
            this.children.splice(index, 1);
            this.emitEvent('removechild', this, child);
        } else {
            console.warn('[MenuItem]: Attempt to remove child element that does not exist', child);
        }
    }

    /**
     * Returns whether or not this menu item is active.
     * 
     * An item is considered 'active' when either the mouse is
     * over the elment or it has an open submenu.
     */
    isActive() {
        return this.active;
    }

    /**
     * Sets this menu item avtive oder inactive.
     * 
     * An item is considered 'active' when either the mouse is
     * over the elment or it has an open submenu.
     * @param {boolean} val 
     */
    setActive(val) {
        if(val != this.active) {
            this.active = val;
            this.emitEvent('activechange', this, val);
        }
    }

    /**
     * Returns whether or not this menu item is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Enables or diables this menu item
     * @param {boolean} val 
     */
    setEnabled(val) {
        if(val != this.enabled) {
            this.enabled = val;
            this.emitEvent('enabledchange', this, val);
        }
    }

    /**
     * Returns the unique id of this menu item
     */
    getId() {
        return this.menuItemId;
    }

    /**
     * Recursivle search this element and its children for a 
     * MenuItem with the given id. Returns undefined if not found
     * @param {string} id 
     */
    find(id) {
        if(this.getId() == id) {
            return this;
        } else {
            return this.getChildren().find((c) => c.find(id));
        }
    }
}

// Safari does not support static class members yet, so set it
// up the oldschool way...
MenuItem.menuItemIdCounter = 0;

class MenuManager {
    constructor() {
        this.menuRoot = new MenuItem('root');

        this.menuRoot.addChild(new MenuItem('File', 'file'));
        this.menuRoot.addChild(new MenuItem('Edit', 'edit'));
        this.menuRoot.addChild(new MenuItem('View', 'view'));
        this.menuRoot.addChild(new MenuItem('Image', 'image'));
        this.menuRoot.addChild(new MenuItem('Colors', 'colors'));
        this.menuRoot.addChild(new MenuItem('Help', 'help'));
    }

    /**
     * Returns the root menu item
     */
    getRoot() {
        return this.menuRoot;
    }

    /**
     * Find a certain menu entry by its id.
     * 
     * @param {string} id Id of the menu item to find 
     */
    find(id) {
        return this.menuRoot.find(id);
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

    /**
     * Event handler for when a new menu bar item is added
     * @param {MenuItem} child 
     */
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

    /**
     * Event handler for when a menu bar item is removed
     * @param {MenuItem} child 
     */
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

        this.menuItem.addEventListener('activechange',  (_, e) => this.menuItemActiveChange(e));
        this.menuItem.addEventListener('addchild',      (_, c) => this.addChild(c));
        this.menuItem.addEventListener('removeChild',   (_, c) => this.removeChild(c));
        this.menuItem.addEventListener('enabledchange', (_, e) => this.menuItemEnabledChange(e));

        // Handler that is triggered everytime a child item adds/removes a child item
        this.childSubMenuHandler = (c) => this.updateChildItemStyle(c);
        // Initial setup for children
        this.menuItem.getChildren().forEach((c) => this.addChild(c));
        // Initial active state
        this.menuItemActiveChange(this.menuItem.isActive());
        // Initial enabled state
        this.menuItemEnabledChange(this.menuItem.isEnabled());
    }

    /**
     * Event handler that gets triggered when the item becomes active or inactive
     * @param {boolean} active 
     */
    menuItemActiveChange(active) {
        // Only show the menu if the item actually has children
        if(active && this.menuItem.hasChildren()) {
            this.htmlElement.classList.add('active');
        } else {
            this.htmlElement.classList.remove('active');
        }
    }

    /**
     * Event handler that gets triggered when the item is enabled or disabled
     * @param {boolean} enabled 
     */
    menuItemEnabledChange(enabled) {
        if(!enabled && !this.htmlElement.classList.contains('disabled')) {
            this.parentHtmlElement.classList.add('disabled');
        } else if (enabled) {
            this.parentHtmlElement.classList.remove('disabled');
        }
    }

    /**
     * Checks if the give item has children, and if yes, adds a css class
     * Used for the arrow next to menu item with submenus.
     * @param {MenuItem} child 
     */
    updateChildItemStyle(child) {
        const menuItemWithSubMenuClass = 'menu-item-with-submenu';
        const el = this.childElements[child.getId()];

        if(child.hasChildren()) {
            if(!el.classList.contains(menuItemWithSubMenuClass)) {
                el.classList.add(menuItemWithSubMenuClass);
            }
        } else {
            el.classList.remove(menuItemWithSubMenuClass);
        }
    }

    addChild(child) {

        // Load html template
        const template = document.querySelector('#menu-bar-item-template');
        // Instanciate the template into a document fragment
        const fragment = template.content.cloneNode(true);
        // We need the first element as reference
        const el = fragment.querySelector('div');
        this.htmlElement.appendChild(fragment);

        // Set title
        el.querySelector('.menu-title').innerText = child.getName();
        // Set event handlers
        el.onmouseover = () => child.setActive(true);
        el.onmouseout = () => child.setActive(false);
        el.onclick = (e) => {
            if(child.isEnabled()) {
                child.emitEvent('click', child, e);
            }
        }

        // Save reference for later
        this.childElements[child.getId()] = el;

        // Sub menu handling
        child.addEventListener('addchild', this.childSubMenuHandler);
        child.addEventListener('removeChild', this.childSubMenuHandler);
        this.updateChildItemStyle(child);
        // Add submenu
        new Menu(child, el, ENUM_MENUPOSITION_RIGHT);
    }

    removeChild(child) {
        const el = this.childElements[child.getId()];
        if(el) {
            // Remove submenu event handlers
            // No need to call updateChildItemStyle since the element is removed anyways
            this.child.removeEventListener('addchild', this.childSubMenuHandler);
            this.child.removeEventListener('removeChild', this.childSubMenuHandler);

            this.htmlElement.removeChild(el);
            delete this.childElements[child.getId()];
        } else {
            console.warn('[Menu]: Attempting to remove child that does not exist', child);
        }
    }
}