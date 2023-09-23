let jsloadin = (function(){
    
    function advanceKey(obj, name="", getPath=false, makePath=true, value=undefined, merge=false){
        if(getPath && name === "") return obj;
        let index = name.indexOf(".");
        if(index===-1) {
            if(getPath) return obj[name];
            if(merge){
                if(typeof obj[name] === "object"){
                    value =  Object.assign(value, obj[name]);
                }
            }
            return obj[name] = value;
        }
        let key = name.slice(0, index);
        name = name.slice(index+1);
        if(typeof obj[key] === "undefined"){
            if(makePath){
                obj[key] = {};
            } else {
                return;
            }
        }
        obj = obj[key];
        return advanceKey(obj, name, getPath, makePath, value, merge);
    }

    let elements = {}

    function setElement(name, value){
        return advanceKey(elements, name, false, true, value, true);
    }
    function getElement(name){
        return advanceKey(elements, name, true, false);
    }
    function verifyElements(list){
        let failed = [];
        for(let item of list){
            if(!getElement(item)) failed.push(item);
        }
        return failed;
    }
    function fetchElements(obj){
        let failed = [];
        for(let key in obj){
            let name = obj[key];
            obj[key] = getElement(name);
            if(!obj[key]){
                failed.push(name);
            }
        }
        return [obj, failed];
    }

    class JSLoadInElement {
        constructor(elm){
            this.documentElement = elm;
        }
        initFlag(flag){
            if(flag[0] === "#"){
                let id = flag.slice(1);
                this.id = id;
                setElement(id, this);
                return this;
            }
            if(flag === "clear"){
                while(this.documentElement.firstChild){
                    this.documentElement.removeChild(this.documentElement.firstChild);
                }
                return this;
            }
            if(flag === "clone"){
                this.element = this.clone();
                return this;
            }
            if(flag === "delete"){
                this.documentElement.parentElement.removeChild(this.documentElement);
                delete this.documentElement;
                return this;
            }
            if(flag[0] === "*"){
                let num = Number(flag.slice(1));
                if(num){
                    let elms = [];
                    while(num>0){
                        elms.push(this.clone());
                        num--;
                    }
                    this.documentElement.after(...elms);
                }
                return this;
            }
        }
        initFlags(...flags){
            for(let flag of flags){
                this.initFlag(flag);
            }
            return this;
        }
        initAttr(){
            let attr = this.documentElement.attributes.getNamedItem("jsloadin");
            if(attr){
                let flags = attr.value.split(" ");
                this.documentElement.attributes.removeNamedItem("jsloadin");
                this.initFlags(...flags);
            }
            return this;
        }
        clone(){
            return (this.element || this.documentElement).cloneNode(true);
        }
    }

    function loadin(element){
        if(!(element instanceof Element)) return;
        let attr = element.attributes.getNamedItem("jsloadin");
        let children = [...element.childNodes];
        if(attr){
            ( new JSLoadInElement(element) ).initAttr();
        }
        for(let elm of children){
            loadin(elm);
        }
    }
    return {
        loadin: loadin,
        JSLoadInElement: JSLoadInElement,
        get: getElement,
        verify: verifyElements,
        fetch: fetchElements
    };
})();