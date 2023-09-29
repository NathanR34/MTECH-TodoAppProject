let TodoApp = (function(appElement, version, userTools=(new UserTools()), devTools=(new DevTools()), {debug:debugMode=false}={}){

    

    class App extends AppTools {
        constructor(selected_version, userTools, devTools){

            const APP_NAME = "Listo";
            const APP_VERSION = "0";
            const APP_MIN_VERSION = "0";
            const APP_MAX_KNOWN_VERSION = "1";
            const APP_MAX_VERSION = "0";

            super(APP_NAME, userTools, devTools, {
                version: APP_VERSION,
                min: APP_MIN_VERSION,
                max: APP_MAX_VERSION,
                max_known: APP_MAX_KNOWN_VERSION
            });

            this.hasNotifiedUser = debugMode;
            this.selected_version = selected_version;
            let selectedVersionType = this.compareVersion(selected_version);
            if(selectedVersionType.startsWith("invalid")){
                this.sumbitFailure(`invalid version: ${selected_version} (${selectedVersionType}). Need a version between ${APP_MIN_VERSION || "any"} through ${APP_MAX_VERSION || "any"}. \nCurrent version: ${APP_VERSION}`);
            }
        }
        sumbitFailure(...log){
            if(!this.hasNotifiedUser){
                try {
                    this.user.notify("Unfortunatly the todo app has failed to initialize correctly. \nYou will likely notice broken functionality. ");
                } catch (err){
                    this.dev.log("Failed to notify user. (App is broken)");
                }
                this.hasNotifiedUser = true;
            }
            this.dev.log(...log);
            throw new Error("Broken app error.");
        }
    }

    let app = new App(version, userTools, devTools);

    if(!(appElement)){
        app.submitFailure("No app element to build app in. Current app element:", appElement);
    }

    let HostGroup = groupTools.HostGroup;
    let Group = groupTools.Group;

    let todoApp = {};

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
        jsloadin.queryAs(appElement, appContent, onFail, failed);
        if(failed.length > 0) {
            app.submitFailure("Missing elements:", failed);
        }
        failed = [];
        jsloadin.loadin(document.body);
        jsloadin.getAs(appElements, onFail, failed);
        if(failed.length > 0){
            app.submitFailure("Failed to initialize jsloadin elements:", failed);
        }
    }

    /* MAIN */

    let todoLists = [];

    let currentContent = null;

    class TodoList {
        constructor(element){
            this.group = new HostGroup(this);
            this.element = element;
            let buttons = jsloadin.queryAllAs(element, {
                add: "[todo*=add]"
            });
            this.buttons = buttons;

        }
        static load(data, element){
            let list = new TodoList(element);
            list.load(data.list);
            return list;
        }
        // Host
        addMember(item){
            this.element.appendChild(item.element);
            return true;
        }
        removeMember(item){
            if(item.element.parentElement === this.element){
                this.element.removeChild(item.element);
            }
            return true;
        }
        notify(){

        }
        // Host end
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
            for(let member in this.group){
                lists.push(member.save());
            }
            return lists;
        }
        load(list, ...args){
            for(let data in list){
                let content = TodoContent.load(data, this.group, ...args);
                this.add(content);
            }
        }
    }

    class TodoContent {
        constructor(name, element){
            this.name = name;
            this.todos = new HostGroup();
            this.element = element;
            this.label = this.labelElement = element.querySelector("[todo*=label]") || element;
            let buttons = jsloadin.queryAllAs(element, {
                duplicate: "[todo*=duplicate]",
                delete: "[todo*=delete]",
                edit: "[todo*=edit]"
            });
            this.buttons = buttons;
            element.onclick = this.onclick;
            this.name = name;
        }
        static fromModel(name, model){
            return new TodoContent(name, model.clone());
        }
        static fromModelAll(names, model){
            let items = [];
            for(let name of names){
                let item = TodoContent.fromModel(name, model);
                items.push(item);
            }
            return items;
        }
        static load(item, group, model){
            let content = TodoContent.fromModel(model);
            content.load(item);
            if(group) group.add(content);
            return content;
        }
        set name(name){
            this._name = name;
            this.label.innerText = name;
        }
        get name(){
            return this._name;
        }
        set active(active){
            if(active != this._active){
                active = !!active;
                if(active){
                    this.element.classList.add("active");
                } else {
                    this.element.classList.remove("active");
                }
                this._active = active;
            }
        }
        get active(){
            return this._active;
        }
        onclick(...args){
            console.log(args, this);
        }
        notify(from, {active}){
            if(!active) this.active = active;
        }
        select(){

        }
        add(todo){
            this.todos.add(todo);
        }
        load(data){
            this.name = data.name;
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
        constructor(goal){
            this.goal = goal;
        }
        static load(data){
            let todo = new TodoItem();
            todo.load(data);
            return todo;
        }
        load(data){
            this.goal = data.goal
        }
    }
    

    let content = {
        current: undefined,
        empty: {},
        set: function set(content=undefined){
            if(typeof content !== undefined){
                content = this.empty;
            }
            appContent.content.clear();
            this.current = content;
            
        },
        reload: function reload(){

        }
    }

    let listContent = {
        clear: function clear(){

        },
        add: function add(item){

        },
        reload: function reload(){

        },
        select: function select(item=undefined){
            
        }
    }

    function addListItem(name){
        let item = new TodoList(name);
        todoItems.push(item);
    }

    function selectItem(item=undefined){
        content.set(item);
        contentList.select(item);
    }

    function reloadList(){
        clearList();
        /*for(let item of todoItems){
            elements.list
        }*/
        reloadContent();
    }
    function reloadContent(){

    }
});

