
let keyop = (function keyop(){
    /*
        options:
            accept=type: accepts the target value for the operation. 
            make=type: make (overwrite) the path of anything that matches the type. 
            merge=type: go into elements that match the type. 
            type=>type: function to determine element type (using bits). 
            create=>object: function that creates a new object for a path. 
            fail=>value: A value to default to upon failure.
        types: void => 1, value => 2, element => 4, object => 8, funtion => 16
        types can be changed by using a different type function (and by overiding default options in usage)

        Mix types using bit operations

        Operands on a branch from a string representing a key of that branch
        Operands providing setting, getting, path creation, filtering, and other functionality
    */
    const VOID = 1;
    const VALUE = 2;
    const ELEMENT = 4;
    const OBJECT = 8;
    const FUNCTION = 16;
    // A type getting function
    function getType(elm){
        if(!elm){
            // undefined
            if(elm === undefined) return VOID;
            // null, false, empty string (""), NaN, 0, -0, 0n, document.all
            return VALUE;
        }
        // selected tree structure
        switch(elm.constructor){
            case Object:
            case Array:
                return OBJECT;
        }
        switch(typeof elm){
            case "object":
                // class instances, arrays, etc
                return ELEMENT;
            case "function":
                // classes and functions
                return FUNCTION;
        }
        // "boolean", "number", "bigint", "string", "symbol"
        return VALUE;
    }
    // function heads
    function setKey(obj, name, value=undefined, options={}){
        if(name === undefined) return options.fail? options.fail() : undefined;
        return setKeyBase(obj, name.split("."), value, options);
    }
    function getKey(obj, name=undefined, options={}){
        if(name === undefined) return obj;
        return getKeyBase(obj, name.split("."), options);
    }
    // function bases
    function setKeyBase(obj, nameList, value, {accept=~0, make=~0, merge=OBJECT|ELEMENT, type:typeOf=getType, create=()=>({}), fail=()=>undefined}){
        let type, next;
        for(let i=0; i<nameList.length-1; i++){
            next = obj[nameList[i]];
            type = typeOf(next);
            if(!(type & merge)){
                if(type & make){
                    obj = obj[nameList[i]] = create();
                    continue;
                } else {
                    return fail();
                }
            }
            obj = next;
        }
        let name = nameList[nameList.length - 1];
        if(typeOf(obj[name]) & accept){
            return ( obj[name] = value );
        } else {
            return fail();
        }
    }
    function getKeyBase(obj, nameList, {accept=~VOID, merge=OBJECT|ELEMENT, type:typeOf=getType, fail=()=>undefined}){
        let type, next;
        for(let i=0; i<nameList.length-1; i++){
            next = obj[nameList[i]];
            type = typeOf(next);
            if(!(type & merge)) return fail();
            obj = next;
        }
        next = obj[nameList[nameList.length - 1]];
        if(typeOf(next) & accept){
            return next;
        } else {
            return fail();
        }
    }
    // "this" for use in a class or object
    function setThisKey(name, value, options){
        return setKey(this, name, value, options);
    }
    function getThisKey(name, options){
        return getKey(this, name, options);
    }
    // "bind" to connect to a specific object
    function bindGetKey(obj, optionsElement={}){
        function get(name, options=optionsElement){
            return getKey(obj, name, options);
        }
        return get;
    }
    function bindSetKey(obj, optionsElement={}){
        function set(name, value=undefined, options=optionsElement){
            return setKey(obj, name, value, options);
        }
        return set;
    }
    // "const bind" bind without access to settings
    function bindConstGetKey(obj, options){
        function get(name){
            return getKey(obj, name, options);
        }
        return get;
    }
    function bindConstSetKey(obj, options){
        function set(name, value=undefined){
            return setKey(obj, name, value, options);
        }
        return set;
    }
    // "interface bind" bind with the settings passed through a function to control the settings input
    function bindInterfaceGetKey(obj, adjust=()=>{}){
        function get(name, options){
            return getKey(obj, name, adjust(options));
        }
        return get;
    }
    function bindInterfaceSetKey(obj, adjust=()=>{}){
        function set(name, value=undefined, options){
            return setKey(obj, name, value, adjust(options));
        }
        return set;
    }
    let keyop = {
        get: getKey,
        set: setKey,
        this: {
            get: getThisKey,
            set: setThisKey
        },
        bind: {
            get: bindGetKey,
            set: bindSetKey,
            const: {
                get: bindConstGetKey,
                set: bindConstSetKey
            },
            interface: {
                get: bindInterfaceGetKey,
                set: bindInterfaceSetKey
            }
        },
        type: {
            get: getType,
            void: VOID,
            value: VALUE,
            element: ELEMENT,
            object: OBJECT,
            function: FUNCTION
        }
    };
    Object.freeze(keyop.this);
    Object.freeze(keyop.bind.const);
    Object.freeze(keyop.bind.interface);
    Object.freeze(keyop.bind);
    Object.freeze(keyop.type);
    Object.freeze(keyop);
    return keyop;
})();