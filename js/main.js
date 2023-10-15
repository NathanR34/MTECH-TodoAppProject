
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
todoApp.load();