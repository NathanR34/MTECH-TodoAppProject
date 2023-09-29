let AppTools = (function(){
    class AppTools {
        static compareVersion(selected, {version, min, max, max_known}={}){
            if(max_known && selected > max_known){
                return "new";
            }
            if(max && selected > max){
                return "invalid_new";
            }
            if(min && selected < min){
                return "invalid_old";
            }
            if(selected < version){
                return "old";
            }
            return "current";
        }
        constructor(name, userTools, devTools, versionInfo={version="0", min, max, max_known}={}){
            this.name = name;
            this.user = userTools || (new AppTools.UserTools());
            this.dev = devTools || (new AppTools.DevTools());
            this.versionInfo = versionInfo;
        }
        compareVersion(version){
            return AppTools.compareVersion(version, this.versionInfo);
        }
        log(){}
    }
    AppTools.UserTools = class UserTools {
        constructor(notify=()=>{}){
            this.notify = notify;
        }
        notify(){}
    }
    AppTools.DevTools = class DevTools {
        constructor(log=()=>{}){
            this.log = log;
        }
    }
    return AppTools;
})();