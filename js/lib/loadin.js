let jsloadin = (function(){

    let elements = {}
    let get = keyop.bind.get(elements);
    let set = keyop.bind.set(elements);

    class JSLoadInElement {
        constructor(elm){
            this.element = elm;
            let attr = elm.attributes.getNamedItem("jsloadin");
            if(attr){
                attr = attr.value.split(" ");
                elm.attributes.removeNamedItem("jsloadin");
                this.attr = attr;
            } else {
                this.attr = [];
            }
        }
        get parent(){
            return this.parent || this.element.parentElement;
        }
        initFlag(flag){
            if(flag[0] === "#"){
                this.setId(flag.slice(1));
            } 
            else if(flag === "soft-clone"){
                this.element = this.softClone();
            }
            else if(flag === "clone"){
                this.element = this.clone();
            } 
            else if(flag.indexOf("clone#") === 0){
                (new JSLoadInElement(this.clone())).setId(flag.slice(6));
            } 
            else if(flag.indexOf("soft-clone#") === 0){
                (new JSLoadInElement(this.softClone())).setId(flag.slice(11));
            } 
            else if(flag === "clear"){
                while(this.element.firstChild){
                    this.element.removeChild(this.element.firstChild);
                }
            } 
            else if(flag === "clear-elements"){
                while(this.element.firstElementChild){
                    this.element.removeChild(this.element.firstElementChild);
                }
            } 
            else if(flag === "remove" && this.element.parentElement){
                this.element.parentElement.removeChild(this.element);
            } 
            else if(flag[0] === "*" && this.element.parentElement){
                let num = Number(flag.slice(1));
                if(num){
                    let elms = [];
                    while(num>0){
                        elms.push(this.clone());
                        num--;
                    }
                    this.element.after(...elms);
                }
            }
            return this;
        }
        initFlags(...flags){
            for(let flag of flags){
                this.initFlag(flag);
            }
            return this;
        }
        initAttr(){
            this.initFlags(...this.attr);
            this.attr = [];
            return this;
        }
        clone(){
            return this.element.cloneNode(true);
        }
        softClone(){
            return this.element.cloneNode(false);
        }
        setId(id){
            this.id = id;
            set(id, this);
        }
    }

    function loadin(element){
        if(!(element instanceof Element)) return;
        let attr = element.attributes.getNamedItem("jsloadin");
        let children = [...element.children];
        for(let elm of children){
            loadin(elm);
        }
        if(attr){
            ( new JSLoadInElement(element) ).initAttr();
        }
        
    }
    function verifyElements(list){
        let failed = [];
        for(let item of list){
            if(!get(item)) failed.push(item);
        }
        return failed;
    }
    function getAs(obj, modify, onFail, failData){
        for(let key in obj){
            let name = obj[key];
            let result = get(name);
            if(!result && onFail){
                result = onFail(failData, key, name, result);
            }
            if(modify){
                result = modify(result, onFail, failData);
            }
            keyop.set(obj, key, result);
        }
        return obj;
    }
    function queryAs(element, obj, modify, onFail, failData){
        for(let key in obj){
            let query = obj[key];
            let result = element.querySelector(query);
            if(!result && onFail){
                result = onFail(failData, key, query, result);
            }
            if(modify){
                result = modify(result, onFail, failData);
            }
            keyop.set(obj, key, result);
        }
        return obj;
    }
    function queryAllAs(element, obj, modify, onFail, failData){
        for(let key in obj){
            let query = obj[key];
            let result = element.querySelectorAll(query);
            if(!result.length && onFail){
                result = onFail(failData, key, query, result);
            }
            if(modify){
                result = modify(result, onFail, failData);
            }
            keyop.set(obj, key, result);
        }
        return obj;
    }
    function idsAs(element, obj, modify, onFail, failData){
        for(let key in obj){
            let id = obj[key];
            let result = element.getElementById(id);
            if(!result && onFail){
                result = onFail(failData, key, id, result);
            }
            if(modify){
                result = modify(result, onFail, failData);
            }
            keyop.set(obj, key, result);
        }
        return obj;
    }
    return {
        loadin: loadin,
        JSLoadInElement: JSLoadInElement,
        get: keyop.bind.interface.get(elements),
        set: keyop.bind.interface.set(elements),
        verify: verifyElements,
        getAs: getAs,
        queryAs: queryAs,
        queryAllAs: queryAllAs,
        idsAs: idsAs
    };
})();