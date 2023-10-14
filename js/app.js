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
        list: "#content-list",
        title: "#todo-title",
        todoList: "#todo-list",
        content: "#content",
        input: "#list-input",
        inputContainer: "#list-input-container"
    }

    let appElements = {
        listItem: "todo.list.item",
        todoItem: "todo.content.item",
        userSettings: "todo.user.settings",
        userProfile: "todo.user.profile"
    }

    let appButtons = {
        "userProfile": "#user-profile-button",
        "userSettings": "#user-settings-button"
    }

    /*  INITIALIZATION  */
    {
        function onFail(arr, key, value){
            arr.push(value);
        }

        let failed = [];
        jsloadin.queryAs(appElement, appContent, null, onFail, failed);
        if(failed.length > 0) {
            app.submitFailure("Missing elements:", failed);
        }
        failed = [];
        jsloadin.loadin(document.body);
        jsloadin.getAs(appElements, null, onFail, failed);
        if(failed.length > 0){
            app.submitFailure("Failed to find jsloadin elements:", failed);
        }
        jsloadin.queryAllAs(appElement, appButtons, 
            (elements)=>(new ElementGroupInterface(elements, {
                settings: appElements.userSettings, 
            }))
        )
    }

    /* Interaction */

    let responses = {}

    {
        responses.activate = new Response("click", function(ei, elm, event){
            ei.ref.host.active = true;
        });
    
        function edit(ei, elm){
            ei.ref.host.startEdit();
        }

        function endEdit(ei){
            ei.ref.host.endEdit();
        }
    
        responses.edit = {
            click: new Response("click", edit),
            dblclick: new Response("dblclick", edit),
            end: {
                keydown: new Response("keydown", function(ei, elm, event){
                    if(event.key === "Enter") endEdit(ei, elm);
                })
            }
        };

        function deleteFn(ei){
            ei.ref.host.delete();
        }
    
        responses.delete = {dblclick: new Response("dblclick", deleteFn)}
        
        function clone(ei, elm, event){

        }

        responses.clone = {click: new Response("click", clone)};
        
        function createListItem(ei, elm){
            elm = ei.ref.valueI && ei.ref.valueI.element || ei.ref.valueElement || elm;
            ei.ref.host.createItem(elm.value, appElements.listItem, todoContentElementInterface);
            elm.value = "";
        }

        function createTodoItem(ei, elm){
            ei.ref.host.createItem("Todo", appElements.todoItem);
        };

        responses.create = {
            list: {
                keydown: new Response("keydown", function(ei, elm, event){
                    if(event.key === "Enter") createListItem(ei, elm);
                }),
                click: new Response("click", createListItem)
            },
            todo: {
                click: new Response("click", createTodoItem)
            }
        }
    }

    

    /* MAIN */

    class TodoList {
        constructor(listElement, inputElement, inputContainer){
            this.listI = new ElementInterface(listElement, {host: this});
            this.inputI = new ElementInterface(inputElement, {host: this});

            this.inputButtons = jsloadin.queryAllAs(inputContainer, {
                    add: "[todo*=add]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, {host: this, valueI: this.inputI}))
            );

            this.inputI.addResponse(responses.create.list.keydown);
            this.inputButtons.add.addResponse(responses.create.list.click);

            this.group = new HostGroup(this);

            this.buttons = jsloadin.queryAllAs(listElement, {
                    add: "[todo*=add]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, {host: this}))
            );
        }
        static load(data, ref){
            let list = new TodoList(ref.listElement, ref.inputElement, ref.inputContainer);
            list.load(data, ref);
            return list;
        }
        save(){
            let lists = [];
            for(let member of this.group){
                lists.push(member.save());
            }
            return {list: lists};
        }
        load(data, ref){
            for(let itemData of data.list){
                this.add(TodoList.Item.load(itamData, ref, this));
            }
        }


        addMember(item){
            return this.listI.add(item.itemI, "prepend");
        }
        removeMember(item){
            return this.listI.remove(item.itemI);
        }
        notify(){}
        receive(){}

        setAllInactive(){
            this.group.notify(this, {active: false});
        }
        add(item){
            return this.group.add(item);
        }
        remove(item){
            if(this.group.remove(item)){
                return true;
            }
            return false;
        }
        createItem(name, model, contentInterface){
            name = parseInput(name);
            if(!name) return false;
            let content = new TodoContent(contentInterface, name);
            let item = TodoList.Item.fromModel(model, content, this);
            this.add(item);
            return true;
        }
    }

    TodoList.Item = class TodoListItem {
        constructor(itemElement, content, contentList){

            this.contentList = contentList;

            this.itemI = new ElementInterface(itemElement, {host: this});
            // TODO add interactivity

            let labelElement = itemElement.querySelector("[todo*=label");
            if(labelElement){
                labelElement = new ElementInterface(labelElement, {host: this});
            } else {
                labelElement = this.itemI;
            }
            this.labelI = labelElement;

            let buttons = jsloadin.queryAllAs(itemElement, {
                    duplicate: "[todo*=duplicate]",
                    delete: "[todo*=delete]",
                    edit: "[todo*=edit]",
                    collapse: "[todo=collapse]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, {host: this}))
            );

            this.labelI.addResponse(responses.activate);

            buttons.edit.addResponse(responses.edit.click);
            buttons.delete.addResponse(responses.delete.dblclick);
            this.labelI.addResponse(responses.edit.end.keydown);

            this.buttons = buttons;
            this.content = content;

            this.inEdit = false;

        }
        static fromModel(itemModel, content, contentList){
            return new TodoListItem(itemModel.clone(), content, contentList);
        }
        static load(data, ref, contentList){
            let content = TodoContent.load(data.content, ref);
            let item = TodoList.Item.fromModel(ref.listItemModel, content, contentList);
            item.load(data.item, ref);
            return item;
        }
        save(){

        }
        load(data, ref){

        }
        clone(){

        }
        startEdit(){
            if(!this.inEdit){
                this.inEdit = true;
                this.labelI.assign("-.prevent-select");
                this.labelI.startEdit();
            } else {
                this.endEdit();
            }
        }
        endEdit(){
            if(this.inEdit){
                this.changeLabel(parseInput(this.labelI.endEdit()));
                this.labelI.assign(".prevent-select");
                this.inEdit = false;
            }
        }
        delete(){
            this.contentList.remove(this);
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
            if(content){
                if(content.agents.add(this)){
                    this.label = content.name;
                    this._content = content;
                } else {
                    this._content = null;
                }
            } else {
                this._content = null;
            }
        }
        get content(){
            return this._content;
        }
        changeLabel(label){
            if(label && this.content){
                this.content.notify(this, {name:label});
            } else {
                this.label = label;
            }
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
        constructor(contentListElement, contentTitleElement, buttonRootElement){
            this.listI = new ElementInterface(contentListElement);
            this.titleI = new ElementInterface(contentTitleElement);
            this.buttons = jsloadin.queryAllAs(buttonRootElement, {
                add: "[todo*=add]"
            }, (elements)=>(new ElementGroupInterface(elements, {host: this})));
            this.buttons.add.addResponse(responses.create.todo.click);
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
        createItem(...args){
            if(this.current){
                this.current.createItem(...args);
            }
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
            this.contentInterface = contentInterface;
            this.name = name;
        }
        static load(data, model){
            let content = TodoContent.fromModel(data.name, model);
            content.load(data);
            if(group) group.add(content);
            return content;
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
        clone(){

        }
        
        set name(name){
            this._name = name;
            this.agents.notify(this, {label:name});
            if(this.contentInterface.current === this){
                this.contentInterface.title = name;
            }
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
            if(name) {
                this.name = name;
            }
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
            this.addToCurrent(todo);
        }
        addToCurrent(todo){
            if(this.contentInterface.current === this){
                this.contentInterface.add(todo);
            }
        }
        remove(todo){
            this.todos.remove(todo);
        }
        createItem(goal, model){
            this.add(TodoItem.fromModel(goal, model));
        }
    }

    class TodoItem {
        constructor(goal, element){
            this.todoI = new ElementInterface(element, {host: this});
            let goalElement = element.querySelector("[todo*=goal]");
            if(goalElement){
                goalElement = new ElementInterface(goalElement, {host: this});
            } else {
                goalElement = this.todoI;
            }
            this.goalI = goalElement;

            this.goal = goal;

            this.inEdit = false;
        }
        static fromModel(goal, model){
            return new TodoItem(goal, model.clone());
        }
        static load(data, model){
            let todo = new TodoItem.fromModel(data.name, model);
            todo.load(data);
            return todo;
        }
        save(){
            return {
                goal: this.goal
            }
        }
        load(){}
        clone(){}
        startEdit(){
            if(!this.inEdit){
                this.inEdit = true;
                this.goalI.startEdit();
                
            } else {
                this.endEdit();
            }
        }
        endEdit(){
            if(this.inEdit){
                this.goal = parseInput(this.goalI.endEdit());
                this.inEdit = false;
            }
        }
        get goal(){
            return this._goal;
        }
        set goal(goal){
            this.goalI.text = goal;
            this._goal = goal;
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
    var todoContentElementInterface = new TodoContentInterfaceStatic(appContent.todoList, appContent.title, appContent.content);

    let todoList = new TodoList(appContent.list, appContent.input, appContent.inputContainer);

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

