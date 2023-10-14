
// Interface tools

let itools = (function(){

    class Response {
        constructor(type, fn){
            this.type = type;
            this.respond = fn;
        }
        bind(handle){
            let type = this.type;
            let types = [type];
            if(!handle[type]){
                handle[type] = new Set();
            }
            handle[type].add(this);
            return types;
        }
        unbind(handle){
            handle[this.type].remove(this);
        }
    }
    
    class ElementInterface {
        constructor(element, ref={}){
            this.ref = ref;
            this.element = element;
            if(element){
                element.controller = this;
            }
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
            this.focus().select();
            return this;
        }
        endEdit(){
            let value = this.element.innerText;
            this.element.contentEditable = false;
            return value;
        }
        addResponse(response){
            for(let type of response.bind(this.handle)){
                this.element.addEventListener(type, this);
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
        add(element, method="append"){
            if(element instanceof ElementInterface){
                element = element.element;
            }
            switch(method){
                case "append":
                    this.element.append(element);
                    break;
                case "prepend":
                    this.element.prepend(element);
                    break;
                default:
                    this.element.append(element);
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
        add(element){
            this.elements.add(new ElementGroupInterface.Member(element, this));
        }
        addAll(elements){
            for(let element of elements){
                this.add(element);
            }
        }
        handleEvent(event, element){
            let type = event.type;
            if(type in this.handle){
                for(let response of this.handle[type]){
                    response.respond(this, element, event);
                }
            }
        }
        addResponse(response){
            let types = response.bind(this.handle);
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
        add(member){
            return this.members.add(member);
        }
        addAll(members){
            let i=0;
            for(let member of members){
                if(this.add(member)) i++;
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
            if(!this.members.has(member) && this.host.addMember(member, this)){
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
        Group: Group,
        HostGroup: HostGroup
    }

    return itools;
})();