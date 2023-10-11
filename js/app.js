let TodoApp = (function(appElement, userTools, devTools){
    
    let app = new AppTools("Listo", devTools, userTools);

    if(!(appElement)){
        app.submitFailure("No app element to build app in. Current app element:", appElement);
    }

    let HostGroup = itools.HostGroup;
    let Group = itools.Group;
    let ElementInterface = itools.element.Interface;
    let ElementGroupInterface = itools.element.group.Interface;
    let Response = itools.Response;

    let appContent = {
        list: "#todo-list",
        title: "#todo-title",
        content: "#todo-content",
        input: "#list-input"
    }

    let appElements = {
        listItem: "todo.list.item",
        todoItem: "todo.content.item"
    }

    /*  INITIALIZATION  */
    {
        function onFail(arr, key, value){
            arr.push(value);
        }

        let failed = [];
        jsloadin.queryAs(appElement, appContent, false, onFail, failed);
        if(failed.length > 0) {
            app.submitFailure("Missing elements:", failed);
        }
        failed = [];
        jsloadin.loadin(document.body);
        jsloadin.getAs(appElements, false, onFail, failed);
        if(failed.length > 0){
            app.submitFailure("Failed to initialize jsloadin elements:", failed);
        }
    }

    /* Interaction */

    let responses = {

    }

    {
        responses.activate = new Response("click", function(ei, elm, event){
            ei.controller.active = true;
        });
    
        function edit(ei, elm, event){
    
        }
    
        responses.edit = {click: new Response("click", edit)};
    
        responses.edit = {dblclick: new Response("dblclick", edit)};

        function deleteFn(ei, elm, event){

        }
    
        responses.delete = {click: new Response("click", deleteFn)}
        
        function clone(ei, elm, event){

        }

        responses.clone = {click: new Response("click", clone)};
        
        function createListItem(ei, elm){
            ei.controller.createItem(parseInput(elm.value), appElements.listItem, todoContentElementInterface);
            elm.value = "";
        }

        responses.create = {
            list:{
                keydown: new Response("keydown", function(ei, elm, event){
                    if(event.key === "Enter") createListItem(ei, elm);
                })
            }
        }
    }

    

    /* MAIN */

    class TodoList {
        constructor(listElement, inputElement){
            this.listI = new ElementInterface(listElement, this);
            this.inputI = new ElementInterface(inputElement, this);

            this.inputI.addResponse(responses.create.list.keydown);

            this.group = new HostGroup(this);

            this.buttons = jsloadin.queryAllAs(listElement, {
                    add: "[todo*=add]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, this))
            );
        }
        static load(data, listElement, args){
            let list = new TodoList(listElement);
            list.load(data, args);
            return list;
        }

        // v Host v //
        addMember(item){
            return this.listI.add(item.itemI);
        }
        removeMember(item){
            return this.listI.remove(item.itemI);
        }
        notify(){}
        // ^ Host End ^ //

        setAllInactive(){
            this.group.notify(this, {active: false});
        }
        add(item){
            return this.group.add(item);
        }
        remove(item){
            return this.group.remove(item);
        }
        save(){
            let lists = [];
            for(let member of this.group){
                lists.push(member.save());
            }
            return {list: lists};
        }
        load(data, args){
            for(let content of data.list){
                let todoContent = TodoContent.load(content, this.group, ...args);
                this.add(todoContent);
            }
        }
        createItem(name, model, contentInterface){
            let content = new TodoContent(contentInterface, name);
            let item = TodoList.Item.fromModel(model, content);
            this.add(item);
        }
    }

    TodoList.Item = class TodoListItem {
        constructor(itemElement, content){

            this.itemI = new ElementInterface(itemElement, this);
            // TODO add interactivity

            let labelElement = itemElement.querySelector("[todo*=label");
            if(labelElement){
                labelElement = new ElementInterface(labelElement, this);
            } else {
                labelElement = this.itemI;
            }
            this.labelI = labelElement;

            let buttons = jsloadin.queryAllAs(itemElement, {
                    duplicate: "[todo*=duplicate]",
                    delete: "[todo*=delete]",
                    edit: "[todo*=edit]",
                    enable: "[todo*=enable]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, this))
            );

            this.labelI.addResponse(responses.activate);

            this.buttons = buttons;
            this.content = content;

        }
        static fromModel(itemModel, content){
            return new TodoListItem(itemModel.clone(), content);
        }
        onclick(){
            
        }
        notify(from, {label, active}){
            if(label !== undefined){
                this.label = label;
            }
            if(active !== undefined){
                this.active = !!active;
            }
        }
        set content(content){
            if(this._content){
                this._content.agents.remove(this);
            }
            content.agents.add(this);
            this.label = content.name;
            this._content = content;
        }
        get content(){
            return this._content;
        }
        set label(label){
            if(this.content){
                this._label = this.content.name;
            } else {
                this._label = label;
            }
            this.labelI.text = this._label;
        }
        set active(active){
            if(active !== this._active){
                active = !!active;
                this._active = active;
                this.itemI.assign(active? ".active" : "-.active");
                this.content.active = true;
            }
        }
        get active(){
            return this._active;
        }
    }

    class TodoContentInterfaceStatic {
        constructor(contentListElement, contentTitleElement){
            this.listI = new ElementInterface(contentListElement);
            this.titleI = new ElementInterface(contentTitleElement);
        }
        set title(title){
            this.titleI.text = title;
        }
        set active(value){
            
        }
        get active(){
            return !!this._current;
        }
        set current(content){
            if(content !== this._current){
                if(this._current){
                    let lastContent = this._current;
                    this._current = null;
                    lastContent.active = false;
                }
                this.removeAll()
                if(content){
                    this.title = content.name;
                    this.addAll(content.todos);
                } else {
                    this.title = "Listo App";
                }
                this._current = content || null;
            }
        }
        get current(){
            return this._current;
        }
        add(element){
            if(element instanceof TodoItem){
                element = element.todoI;
            }
            this.listI.add(element);
        }
        remove(element){
            if(element instanceof TodoItem){
                element = element.todoI;
            }
            this.listI.remove(element);
        }
        removeAll(elements){
            if(elements){
                for(let element of elements){
                    this.remove(element);
                }
            } else {
                this.listI.removeAll();
            }
        }
        addAll(elements){
            for(let element of elements){
                this.add(element);
            }
        }
    }

    class TodoContent {
        constructor(contentInterface, name){
            this.todos = new HostGroup(this);
            this.agents = new HostGroup(this);
            
            this.name = name;
            this.contentInterface = contentInterface;
        }
        static load(data, model){
            console.log(data);
            let content = TodoContent.fromModel(data.name, model);
            content.load(data);
            if(group) group.add(content);
            return content;
        }
        
        set name(name){
            this.agents.notify(this, {label:name});
            this._name = name;
        }
        get name(){
            return this._name;
        }
        set active(active){
            if(active !== this._active){
                if(active === true){
                    this.contentInterface.current = this;
                    this.agents.notify(this, {active: true});
                    this._active = true;
                } else {
                    if(this.contentInterface.current === this){
                        this.contentInterface.current = null;
                    }
                    this.agents.notify(this, {active: false});
                    this._active = false;
                }
            }
        }
        get active(){
            return this._active;
        }
        notify(from, {active, name}){
            if(active !== undefined && !active) this.active = active;
            if(name) this.name = name;
        }
        select(){

        }
        addMember(){
            return true;
        }
        removeMember(){
            return true;
        }
        add(todo){
            this.todos.add(todo);
        }
        remove(todo){
            this.todos.remove(todo);
        }
        load(data){
            for(let item in data.items){
                this.add(TodoItem.load(item));
            }
        }
        save(){
            let items = [];
            for(let item in this.items){
                items.push(item.save());
            }
            return {
                name: this.name,
                items: items
            }
        }
    }

    class TodoItem {
        constructor(goal, element, group){
            this.goal = goal;
            this.element = element;
            this.todoI = new ElementInterface(element);
            this.goalField = element.querySelector("[todo*=goal]") || element;
        }
        static load(data, model){
            let todo = new TodoItem.fromModel(data.name, model);
            todo.load(data);
            return todo;
        }
        static fromModel(goal, model){
            return new TodoItem(goal, model.clone());
        }
        get goal(){
            return this._goal;
        }
        set goal(goal){
            this.goalField.innerText = goal;
            this._goal = goal;
        }
        load(data){
        }
        save(){
            return {
                goal: this.goal
            }
        }
    }

    /* CREATION */

    function parseInput(input){
        let s = "";
        for(let i in input){
            if(i>=16) break;
            let cc = input.charCodeAt(i);
            let c = input[i];
            if(9<=cc && cc<=11) c=" ";
            if(cc<32 || c===127) c="";
            s += c;
        }
        return s;
    }

    var todoContentElementInterface = new TodoContentInterfaceStatic(appContent.content, appContent.title);

    let todoList = new TodoList(appContent.list, appContent.input);

    function load(data){
        todoList.load(data, [appElements.listItem, []]);
    }
    function save(){

    }

    let todoApp = {
        load: load,
        save: save
    };

    return todoApp;
});

