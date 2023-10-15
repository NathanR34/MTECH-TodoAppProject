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
        inputContainer: "#list-input-container",
        userNameInput: "#menu-user-name-input",
        userCodeInput: "#menu-user-code-input"
    }

    let appElements = {
        listItem: "todo.list.item",
        todoItem: "todo.content.item",
        userSettings: "todo.user.settings",
        userProfile: "todo.user.profile"
    }

    let appButtons = {
        "userProfile": "#user-profile-button",
        "userSettings": "#user-settings-button",
        "userSave": "#menu-save-button",
        "userLoad": "#menu-load-button"
    }

    let appCommon = {
        "userName": ".user-name"
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
            (elements)=>(new ElementGroupInterface(elements))
        )
        jsloadin.queryAllAs(appElement, appCommon, 
            (elements)=>(new ElementGroupInterface(elements))
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
                }),
                focusout: new Response("focusout", endEdit)
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
            let item = ei.ref.host.createItem("", appElements.todoItem);
            if(item){
                item.startEdit();
            }
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

        function onChecked(ei, elm, event){
            ei.ref.host.onToggled(!!elm.checked);
        }

        responses.checkbox = {
            ontoggle: {
                input: new Response("input", onChecked)
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
            let items = [];
            for(let member of this.group){
                items.push(member.save());
            }
            return {items: items};
        }
        load(data={}, ref){
            let dataItems = data.items || [];
            for(let itemData of dataItems){
                this.add(TodoList.Item.load(itemData, ref, {contentList: this}), "append");
            }
        }
        clear(){
            this.listI.removeAll();
        }

        addMember(item, method="prepend"){
            return this.listI.add(item.itemI, method);
        }
        removeMember(item){
            return this.listI.remove(item.itemI);
        }
        notify(){}
        receive(){}

        setAllInactive(){
            this.group.notify(this, {active: false});
        }
        add(item, method){
            return this.group.add(item, method);
        }
        remove(item){
            if(this.group.remove(item)){
                return true;
            }
            return false;
        }
        removeAll(){
            this.group.removeAll();
        }
        createItem(name, model, contentInterface){
            name = parseInput(name, 16);
            if(!name) return false;
            let content = new TodoContent(contentInterface, name);
            let item = TodoList.Item.fromModel(model, content, this);
            this.add(item);
            return true;
        }
    }

    TodoList.Item = class TodoListItem {
        constructor(itemElement, content, contentList){

            if(!contentList){
                app.submitFailure("No content list");
            }
            this.contentList = contentList;

            this.itemI = new ElementInterface(itemElement, {host: this});
            // TODO add interactivity

            let labelElement = itemElement.querySelector("[todo*=label");
            if(labelElement){
                labelElement = new ElementInterface(labelElement, {host: this, dragElement: this.itemI});
            } else {
                labelElement = this.itemI;
            }
            this.labelI = labelElement;

            let buttons = jsloadin.queryAllAs(itemElement, {
                    duplicate: "[todo*=duplicate]",
                    delete: "[todo*=remove]",
                    edit: "[todo*=edit]",
                    collapse: "[todo=collapse]"
                }, 
                (elements)=>(new ElementGroupInterface(elements, {host: this}))
            );

            this.labelI.addResponse(responses.activate);

            buttons.edit.addResponse(responses.edit.click);
            buttons.delete.addResponse(responses.delete.dblclick);
            this.labelI.addResponse(responses.edit.end.keydown);
            this.labelI.addResponse(responses.edit.end.focusout);

            this.buttons = buttons;
            this.content = content;

            this.inEdit = false;

        }
        static fromModel(itemModel, content, contentList){
            return new TodoListItem(itemModel.clone(), content, contentList);
        }
        static load(data, ref, local){
            let item = TodoList.Item.fromModel(ref.listItemModel, null, local.contentList);
            item.load(data, ref);
            return item;
        }
        save(){
            return {
                content: this.content.save()
            }
        }
        load(data, ref){
            let content = TodoContent.load(data.content, ref);
            this.content = content;
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
                this.changeLabel(parseInput(this.labelI.endEdit(), 16));
                this.labelI.assign(".prevent-select");
                this.inEdit = false;
            }
        }
        delete(){
            if(this.content === this.content.contentInterface.current){
                this.content.contentInterface.current = null;
            }
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
            if(!this._label) this._label = "";
            this.labelI.text = this._label;
        }
        get label(){
            return this._label;
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
        clear(){
            this.current = null;
        }
        createItem(...args){
            if(this.current){
                return this.current.createItem(...args);
            }
            return null;
        }
        add(element, method){
            if(element instanceof TodoItem){
                element = element.todoI;
            }
            this.listI.add(element, method);
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
        static load(data, ref){
            let content = new TodoContent(ref.contentInterface, data.name);
            content.load(data, ref);
            return content;
        }
        load(data, ref){
            let dataTodos = data.todos || [];
            let local = {content: this};
            for(let todoData of dataTodos){
                this.add(TodoItem.load(todoData, ref, local), "append");
            }
        }
        save(){
            let todos = [];
            for(let todo of this.todos){
                todos.push(todo.save());
            }
            return {
                name: this.name,
                todos: todos
            }
        }
        clone(ref){

        }
        
        set name(name){
            this._name = name;
            this.agents.notify(this, {label:name});
            if(this.contentInterface.current === this){
                this.contentInterface.title = name;
            }
        }
        get name(){
            return this._name || "";
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
        removeMember(todo){
            return true;
        }
        add(todo, method){
            this.todos.add(todo, method);
            this.addToCurrent(todo, method);
        }
        addToCurrent(todo, method){
            if(this.contentInterface.current === this){
                this.contentInterface.add(todo, method);
            }
        }
        removeFromCurrent(todo){
            if(this.contentInterface.current === this){
                this.contentInterface.remove(todo);
            }
        }
        remove(todo){
            this.todos.remove(todo);
            this.removeFromCurrent(todo);
        }
        createItem(goal, model){
            let item = TodoItem.fromModel(goal, model, this);
            this.add(item);
            return item;
        }
        
    }

    class TodoItem {
        constructor(goal, element, content){
            this.todoI = new ElementInterface(element, {host: this, dragElement: this.todoI});
            let goalElement = element.querySelector("[todo*=goal]");
            if(goalElement){
                goalElement = new ElementInterface(goalElement, {host: this, dragElement: this.todoI});
            } else {
                goalElement = this.todoI;
            }

            let buttons = {
                complete: "input[type=checkbox][todo*=checkbox]",
                remove: "[todo*=remove]"
            };
            jsloadin.queryAllAs(element, buttons, (elements)=>(new ElementGroupInterface(elements, {host:this})));

            this.buttons = buttons;

            buttons.complete.addResponse(responses.checkbox.ontoggle.input);
            buttons.remove.addResponse(responses.delete.dblclick);

            this.goalI = goalElement;

            this.goalI.addResponse(responses.edit.dblclick);

            this.goalI.addResponse(responses.edit.end.keydown);

            this.goalI.addResponse(responses.edit.end.focusout);

            this.goal = goal;

            this.inEdit = false;

            if(!content) {
                app.submitFailure("No content object");
            }

            this.content = content;
        }
        static fromModel(goal, model, content){
            return new TodoItem(goal, model.clone(), content);
        }
        static load(data, ref, local){
            let todo = TodoItem.fromModel(data.goal, ref.todoItemModel, local.content);
            todo.load(data, ref);
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
                this.goal = parseInput(this.goalI.endEdit(), 50);
                this.inEdit = false;
            }
        }
        delete(){
            this.content.remove(this);
        }
        onToggled(checked){
            this.goalI.assign(`${checked?"":"-"}.completed`);
        }
        get goal(){
            return this._goal;
        }
        set goal(goal){
            if(!goal) goal = "Todo";
            this.goalI.text = goal;
            this._goal = goal;
        }
    }

    /* CREATION */

    function parseInput(input, maxChars){
        let s = "";
        for(let i in input){
            if(i>=maxChars) break;
            let cc = input.charCodeAt(i);
            let c = input[i];
            if(9<=cc && cc<=11) c=" ";
            if(cc<32 || c===127) c="";
            s += c;
        }
        return s;
    }
    var todoContentElementInterface = new TodoContentInterfaceStatic(appContent.todoList, appContent.title, appContent.content);

    let todoList = null;

    {
        let userProfileEnabled = false;
        let userSettingsEnabled = false;

        let settingsHost = {};
        let profileHost = {};
        let appHost = {};

        let settingsI = new ElementInterface(appElements.userSettings.element, {host: settingsHost});
        let profileI = new ElementInterface(appElements.userProfile.element, {host: profileHost});

        let appI = new ElementInterface(appElement, {host: appHost});

        function toggleUserProfile(){
            if(userProfileEnabled){
                appI.remove(profileI);
                userProfileEnabled = false;
            } else {
                if(userSettingsEnabled){
                    toggleUserSettings();
                }
                appI.add(profileI);
                userProfileEnabled = true;
            }
        }
        function toggleUserSettings(){
            if(userSettingsEnabled){
                appI.remove(settingsI);
                userSettingsEnabled = false;
            } else {
                if(userProfileEnabled){
                    toggleUserProfile();
                }
                appI.add(settingsI);
                userSettingsEnabled = true;
            }
        }

        responses.menu = {
            profile: {
                toggle: {
                    click: new Response("click", toggleUserProfile)
                }
            },
            settings: {
                toggle: {
                    click: new Response("click", toggleUserSettings)
                }
            }
        }

        function logIn(){

        }
    }

    let users = {};

    if(!users) users = {};

    function saveUsers(){
        localStorage.setItem("Listo_users", users);
    }

    function loadUsers(){
        let usersData = localStorage.getItem("Listo_users");
        if(usersData) users = usersData;
    }

    appButtons.userProfile.addResponse(responses.menu.profile.toggle.click);
    appButtons.userSettings.addResponse(responses.menu.settings.toggle.click);

    function clear(){
        todoList.clear();
        todoContentElementInterface.clear();
    }

    function load(data={}){
        let ref = {
            contentInterface: todoContentElementInterface,
            listElement: appContent.list,
            inputElement: appContent.input,
            inputContainer: appContent.inputContainer,
            listItemModel: appElements.listItem,
            todoItemModel: appElements.todoItem
        }
        todoList = TodoList.load(data.list, ref);
    }
    function save(){
        return {
            list: todoList && todoList.save() || {}
        }
    }

    let todoApp = {
        load: load,
        save: save
    };

    return todoApp;
});

