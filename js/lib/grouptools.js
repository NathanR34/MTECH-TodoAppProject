let groupTools = (function(){

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

    let groupTools = {
        Group: Group,
        HostGroup: HostGroup
    };
    return groupTools;
})();