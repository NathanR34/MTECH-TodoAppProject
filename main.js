
let todoApp = TodoApp(
    document.querySelector("#app-container"), 
    function(...arg){window.alert(arg[0])}, 
    function(...args){console.log(...args)},
    true
);
