
// Interface tools

let itools = (function(){

    class Response {
        constructor(type, fn){
            this.type = type;
            this.respond = fn;
        }
        *bind(handle){
            for(let type of this.types()){
                yield type;
                if(!handle[type]){
                    handle[type] = new Set();
                }
                handle[type].add(this);
            }
        }
        unbind(handle){
            handle[this.type].remove(this);
        }
        *types(){
            yield this.type;
        }
    }

    class ResponseCollection {
        constructor(){
            this.responses = {};
        }
        add(name, response){
            keyop.set(this.responses, name, response, {merge: keyop.type.object});
        }
        get(name){
            keyop.get(this.responses, name);
        }
    }
    
    class ElementInterface {
        constructor(element, ref={}){
            this.ref = ref;
            this.element = element;
            this.handle = {};
        }
        focus(){
            this.element.focus();
            return this;
        }
        select(){
            if(this.element.select){
                this.element.select();
            } else {
                window.getSelection().selectAllChildren(this.element);
            }
            
            return this;
        }
        startEdit(){
            this.element.contentEditable = true;
            let dragElement = this.ref.dragElement;
            if(dragElement){
                if(dragElement instanceof ElementInterface){
                    dragElement = dragElement.element;
                }
                if(dragElement.draggable){
                    this.draggable = true;
                }
                if(this.draggable){
                    dragElement.draggable = false;
                }
            }
            this.focus().select();
            return this;
        }
        endEdit(){
            let value = this.element.innerText;
            this.element.contentEditable = false;
            let dragElement = this.ref.dragElement;
            if(dragElement){
                if(dragElement instanceof ElementInterface){
                    dragElement = dragElement.element;
                }
                if(this.draggable){
                    dragElement.draggable = true;
                }
            }
            
            return value;
        }
        addResponse(response){
            for(let type of response.bind(this.handle)){
                this.element.addEventListener(type, this);
            }
        }
        pingResponse(response, end=()=>true){
            let self = this;
            let element = this.element;
            let types = [];
            let i = 0;
            function respond(event){
                response.respond(self, element, event);
                if(end(this, element, ++i)){
                    for(let type of types){
                        element.removeEventListener(type, respond);
                    }
                }
            }
            for(let type of response.types){
                types.push(type);
                this.element.addEventListener(type, respond);
            }
        }
        handleEvent(event){
            let type = event.type;
            if(type in this.handle){
                for(let response of this.handle[type]){
                    response.respond(this, this.element, event);
                }
            }
        }
        add(element, method="append", ref){
            if(element instanceof ElementInterface){
                element = element.element;
            }
            if(typeof method !== "string") throw Error("");
            switch(method){
                case "append":
                    this.element.append(element);
                    break;
                case "prepend":
                    this.element.prepend(element);
                    break;
                case "insert":
                    if(ref instanceof ElementInterface){
                        ref = ref.element;
                    }
                    if(ref instanceof Element){
                        if(ref.parentElement === this.element){
                            ref.after(element);
                            break;
                        }
                    }
                    return false;
                default:
                    return false;
            }
            return true;
        }
        remove(element){
            if(element instanceof ElementInterface){
                element = element.element;
            }
            if(element.parentElement === this.element){
                this.element.removeChild(element);
                return true;
            }
            return false;
        }
        removeAll(){
            while(this.element.firstChild){
                this.element.removeChild(this.element.firstChild);
                document.removeChild
            }
        }
        assign(...classes){
            for(let c of classes){
                switch(c[0]){
                    case ".":
                        this.element.classList.add(c.slice(1));
                        break;
                    case "-":
                        if(c[1] === "."){
                            this.element.classList.remove(c.slice(2));
                        }
                        break;
                }
            }
        }
        set text(text){
            this.element.innerText = text;
        }
        get text(){
            return this.element.innerText;
        }
        set value(value){
            if("value" in this.element){
                this.element.value = value;
            } else {
                this.element.innerText = value;
            }
        }
        get value(){
            if("value" in this.element){
                return this.element.value;
            } else {
                return this.element.innerText;
            }
        }
    };
    
    class ElementGroupInterface {
        constructor(elements, ref){
            this.elements = new Set();
            if(elements){
                this.addAll(elements);
            }
            this.ref = ref;
            this.handle = {};
        }
        *[Symbol.iterator](){
            for(let element of this.elements){
                yield element;
            }
        }
        set text(text){
            for(let element of this){
                element.text = text;
            }
        }
        add(element){
            this.elements.add(new ElementGroupInterface.Member(element, this));
        }
        addAll(elements){
            for(let element of elements){
                this.add(element);
            }
        }
        handleEvent(event, member){
            let type = event.type;
            if(type in this.handle){
                for(let response of this.handle[type]){
                    response.respond(this, member.element, event);
                }
            }
        }
        addResponse(response){
            let types = [...response.bind(this.handle)];
            for(let element of this.elements){
                element.addEventTypes(...types);
            }
        }
    };
    ElementGroupInterface.Member = class ElementGroupMember extends ElementInterface {
        constructor(element, group){
            super(element);
            this.group = group;
        }
        handleEvent(event){
            this.group.handleEvent(event, this);
        }
        addEventTypes(...types){
            for(let type of types){
                this.element.addEventListener(type, this);
            }
        }
        get ref(){
            return this.group.ref;
        }
        set ref(_){}
    }

    class Group {
        constructor(members){
            this.members = new Set();
            if(members){
                this.addAll(members);
            }
        }
        *[Symbol.iterator](){
            for(let member of this.members){
                yield member;
            }
        }
        get size(){
            return this.members.size;
        }
        add(member, ...args){
            return this.members.add(member, ...args);
        }
        addAll(members, ...args){
            let i=0;
            for(let member of members){
                if(this.add(member, ...args)) i++;
            }
            return i;
        }
        remove(member){
            return this.members.delete(member);
        }
        removeAll(members){
            let i = 0;
            if(members){
                for(let member of members){
                    if(this.remove(member)) i++;
                }
            } else {
                i = this.members.size;
                this.members.clear();
            }
            return i;
        }
        has(member){
            return this.members.has(member);
        }
        notify(from, message, test){
            if(test){
                for(let member of this.members){
                    if(from !== member && test(member)){
                        member.notify(from, message, test);
                    }
                }
            } else {
                for(let member of this.members){
                    if(from !== member){
                        member.notify(from, message);
                    }
                }
            }
        }
    }

    class HostGroup extends Group {
        constructor(host, members){
            super(members);
            this.host = host;
        }
        notifyHost(from, message){
            this.host.notify(from, message);
        }
        add(member){
            if(!this.members.has(member) && this.host.addMember(member)){
                return super.add(member);
            }
            return false;
        }
        remove(member){
            if(this.members.has(member) && this.host.removeMember(member)){
                return super.remove(member);
            }
            return false;
        }
    }

    let itools = {
        element: {
            Interface: ElementInterface,
            group: {
                Interface: ElementGroupInterface
            }
        },
        Response: Response,
        ResponseCollection: ResponseCollection,
        Group: Group,
        HostGroup: HostGroup,
    }

    return itools;
})();