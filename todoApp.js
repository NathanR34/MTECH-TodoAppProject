let TodoApp = (function(appElement, notifyUser=()=>{}, logMessage=()=>{}, debugMode=false){
    let DEBUG_MODE = true;
    let submitAppFailure = (function(){
        let hasNotifiedUser = debugMode;
        return (function submitAppFailure(...log){
            if(!hasNotifiedUser){
                try {
                    notifyUser("Unfortunatly the todo app has failed to initialize correctly. \nYou will likely notice broken functionality. ");
                } catch (err){
                    logMessage("Failed to notify user. (App is broken)");
                }
                hasNotifiedUser = true;
            }
            logMessage(...log);
        });
    })();

    if(!(appElement)){
        submitAppFailure("No app element to build app in. Current app element:", appElement);
    }

    let todoApp = {};

    try {

        let appContent = {
            list: "#todo-list",
            title: "#todo-title",
            content: "#todo-content"
        }

        let appElements = {
            listItem: "todo.list.item",
            todoItem: "todo.content.item"
        }

        /*  INITIALIZATION  */
        if(true){
            let failed = [];
            for(let key in appContent){
                let query = appContent[key];
                appContent[key] = appElement.querySelector(query);
                if(!appContent[key]){
                    failed.push(query);
                }
            }
            if(failed.length > 0) {
                submitAppFailure("Missing elements:", failed);
            }
            jsloadin.loadin(document.body);
            failed = jsloadin.fetch(appElements)[1];
            if(failed.length > 0){
                submitAppFailure("Failed to initialize jsloadin prototypes:", failed);
            }
        }

        /* MAIN */

        let todoItems = [];

        let currentContent = null;

        class TodoList {
            constructor(name){
                this.name = name;
                this.items = [];
            }
            changeName(name){
                this.name = name;
                reloadList();
            }
            addItem(){

            }
        }

        let content = {
            listItem: appElements.listItem,
            contentElement: appContent.content,

            clear: function clear(){

            },
            set: function set(content=undefined){

            },
            reload: function reload(){

            }
        }

        let list = {
            clear: function clear(){

            },
            add: function add(name){

            },
            reload: function reload(){

            }
        }

        function addListItem(name){
            let item = new TodoList(name);
            todoItems.push(item);
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
    } catch (err){
        submitAppFailure("Errors: ");
        throw err;
    }
    return todoApp;
});

