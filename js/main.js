
let todoApp = TodoApp(
    document.querySelector("#app-container"), 
    new AppTools.UserTools(function(...arg){
        window.alert(arg[0]);
    }), 
    new AppTools.DevTools(function(...args){
        console.log(...args);
        throw Error("App Failure");
    }, {debug:true})
);

let items = [];
let goals = [];
for(let i=0; i<24; i++){
    items.push({
        content: {
            name: "item-"+i
        }
    });
    goals.push({
        goal: "todo-"+i
    });
}

todoApp.load({
    list:{
        items: [
            {
                content: {
                    name: "Item1",
                    todos: [
                        {
                            goal: "Todo1"
                        },
                        {
                            goal: "Todo2"
                        }
                    ]
                }
            },
            {
                content: {
                    name: "Item2",
                    todos: goals
                }
            },
            ...items
        ]
    }
});