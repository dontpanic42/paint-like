/**
 * ToolOption represents one option entry in the tool option bar,
 * eg. to select line width, magnification, ....
 */
class ToolOption extends EventEmitter {

    /**
     * Constructor
     * @param {String} cssClass CSS class that will be given to the option container 
     * @param {String} template (optional) HTML template that will be added to container
     */
    constructor({cssClass, template = '', defaultEventHandler = undefined}) {
        super();

        this.cssClass = cssClass;
        this.template = template;

        this.selected = false;

        if(defaultEventHandler) {
            this.addEventListener('select', defaultEventHandler);
        }
    }

    /**
     * Returns whether or not the tool option is currently selected
     */
    isSelected() {
        return this.selected;
    }

    /**
     * Sets the tool option as (de)selected
     * @param {Boolean} val 
     */
    setSelected(val) {
        if(val != this.selected) {
            this.selected = val;
            const event = val ? 'select' : 'deselect';
            this.emitEvent(event, this);
        }
    }

    /**
     * Returns the CSS class(es) that will be given to the option container.
     * 
     * Return value can be a string or an array.
     */
    getCssClass() {
        return this.cssClass;
    }

    /**
     * Returns the template that will be appended to the container
     */
    getTemplate() {
        return this.template;
    }
}

class Tool {

    constructor() {
        this.toolAutoGeneratedId = `tool-id-${Tool.toolIdCounter++}`;
    }

    getName() {
        return 'A Nice Tool';
    }

    getDescription() {
        return 'Just a testing tool'
    }

    getButtonCssClass() {
        return 'unknownTool'
    }

    getId() {
        return this.toolAutoGeneratedId;
    }

    /**
     * Returns the tool options, if any.
     * 
     * Should return an array of ToolOption objects
     */
    getToolOptions() {
        return [];
    }

    // Called when the tool was selected by the user
    onActivate() {

    }

    // Called when another tool was selected by the user
    onDeactivate() {

    }
}

// Safari does not support static class members yet, so set it
// up the oldschool way...
Tool.toolIdCounter = 0;

class ToolManager extends EventEmitter {

    constructor() {
        super();
        this.tools = [];
        this.selectedToolInternal = undefined;
    }

    addTool(tool) {
        if(this.tools.indexOf(tool) === -1) {
            this.emitEvent('tooladd', tool, this.tools.length);
            this.tools.push(tool);

            if(!this.selectedTool) {
                this.selectedTool = tool;
            }

        } else {
            console.warn(`Tool "${tool.getName()}" already exists in ToolManager, not adding it twice.`);
        }
    }

    removeTool(tool) {
        const toolIndex = this.tools.indexOf(tool);
        if(toolIndex != -1) {
            this.emitEvent('toolremove', tool, toolIndex);
            this.tools.splice(toolIndex, 1);
        }
    }

    getTools() {
        return this.tools;
    }

    get selectedTool() {
        return this.selectedToolInternal;
    }  
    
    set selectedTool(tool) {
        if(this.selectedTool !== tool) {
            if(this.selectedTool !== undefined) {
                this.selectedTool.onDeactivate();
            } 

            this.emitEvent('toolselect', tool);
            this.selectedToolInternal = tool;
            tool.onActivate();
        }
    }
}

class ToolBar {
    constructor(toolManager, htmlElement) {
        this.toolManager = toolManager;
        this.toolButtons = {};
        this.htmlElement = htmlElement;
        this.activeClassName = 'active';

        this.toolManager.getTools().forEach((t) => this.addTool(t))

        this.toolManager.addEventListener('tooladd', (t) => this.addTool(t));
        this.toolManager.addEventListener('toolremove', (t) => this.removeTool(t));
        this.toolManager.addEventListener('toolselect', (t) => this.selectTool(t));
    }

    addTool(tool) {
        // Create element & element setup
        const button = document.createElement('div');
        button.classList.add(tool.getButtonCssClass());
        button.title = `${tool.getName()}\n\n${tool.getDescription()}`;
        this.htmlElement.appendChild(button);
        // Register click handler
        button.onclick = () => this.toolManager.selectedTool = tool;
        // Save html object for management
        this.toolButtons[tool.getId()] = button;
        // When this is the currently selected tool, set the 'active' class
        if(this.toolManager.selectedTool === tool) {
            button.classList.add(this.activeClassName);
        }
    }

    removeTool(tool) {
        const toolId = tool.getId();
        const button = this.toolButtons[toolId];
        if(typeof(button !== 'undefined')) {
            this.htmlElement.removeChld(button);
            delete this.toolButtons[toolId];
        }
    }

    selectTool(tool) {
        // Remove all active classes
        Object.values(this.toolButtons).forEach(otherButton => {
            otherButton.classList.remove(this.activeClassName);
        });
        
        // (Re-)add the active class to the selected button
        const button = this.toolButtons[tool.getId()];
        if(button) {
            button.classList.add(this.activeClassName);
        }
    }
}

class ToolOptionsBar {
    constructor(toolManager, htmlElement) {
        this.htmlElement = htmlElement;
        this.toolManager = toolManager;

        this.toolManager.addEventListener('toolselect', (t) => this.selectTool(t));
        // If there is already a tool selected when creating this bar
        if(toolManager.selectedTool) {
            // Set it as selected tool manually
            this.selectTool(toolManager.selectedTool);
        }
    }

    /**
     * Sets up the ToolOptionsBar to show/process options for the given
     * tool.
     * @param {Tool} tool 
     */
    selectTool(tool) {
        // Remove all child nodes of the option menu
        while(this.htmlElement.firstChild) {
            this.htmlElement.removeChild(this.htmlElement.firstChild);
        }

        const toolOptions = tool.getToolOptions() || [];
        toolOptions.forEach((option) => {
            // Create a container element for the option
            const el = document.createElement('div');
            // Assign the default- and user defined css classes. Custo css class
            // can be a string or an array
            const cssCls = ['tool-option'].concat(option.getCssClass());
            el.classList.add(...cssCls);
            // Set the content to the template (if any)
            el.innerHTML = option.getTemplate();

            // Add an event listener to the option so we get notified when
            // the selection state changes
            option.addEventListener('select', () => {
                // Set all other tools to not selected
                toolOptions.forEach((option) => option.setSelected(false));
                // Ensure that all html elements lose the 'selected' class
                for(let i = 0; i < this.htmlElement.children.length; i++) {
                    this.htmlElement.children[i].classList.remove('selected');
                }
                // Add the 'selected' class to the current element
                el.classList.add('selected');
            });

            // Add an onclick event handler for option selection. All the logic is in
            // the options 'select' event listener
            el.addEventListener('click', () => option.setSelected(true), false);

            // Add the menu item to the DOM
            this.htmlElement.appendChild(el);
        });
        
        // Select the first tool option (if there are any)
        if(toolOptions.length) {
            toolOptions[0].setSelected(true);
        }
    }
}