
let todoApp = TodoApp(
    document.querySelector("#app-container"), 
    "1.0",
    new AppTools.UserTools(function(...arg){window.alert(arg[0])}), 
    new AppTools.DevTools(function(...args){console.log(...args)}),
    {debug:true}
);
