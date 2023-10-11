let AppTools = (function(){
    class UserTools {
        constructor(notify=()=>{}){
            this.notify = notify;
        }
        notify(){}
    }
    class DevTools {
        constructor(log=()=>{}, {debug=false}={}){
            this.log = log;
            this.debug = debug;
        }
    }
    class AppTools {
        constructor(appName, devTools=(new DevTools()), userTools=(new UserTools())){
            this.name = appName;
            this.dev = devTools;
            this.user = userTools;
            this.hasNotifiedUser = devTools.debug;
        }
        submitFailure(...log){
            if(!this.hasNotifiedUser){
                try {
                    this.user.notify(`${this.name} has failed to initialize correctly. \nYou will likely notice broken functionality. `);
                } catch (err){
                    this.dev.log(`Failed to notify user. (App is broken)`);
                }
                this.hasNotifiedUser = true;
            }
            this.dev.log(...log);
        }
    }
    AppTools.UserTools = UserTools;
    AppTools.DevTools = DevTools;
    return AppTools;
})();