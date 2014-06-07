void function () {
    var _, cache$, clone, debug, initializeGlobalTypes, primitives, rewrite;
    debug = require('./helpers').debug;
    cache$ = require('./type-helpers');
    clone = cache$.clone;
    rewrite = cache$.rewrite;
    _ = require('lodash');
    Scope = function () {
        function Scope(param$) {
            if (null == param$)
                param$ = null;
            this.parent = param$;
            if (null != this.parent)
                this.parent.nodes.push(this);
            this.name = '';
            this.nodes = [];
            this.vars = [];
            this.types = [];
            this._this = {};
            this._modules = {};
            this._returnables = [];
        }
        Scope.prototype.addReturnable = function (symbol, typeRef) {
            return this._returnables.push(typeRef);
        };
        Scope.prototype.getReturnables = function () {
            return this._returnables;
        };
        Scope.prototype.getRoot = function () {
            var root;
            if (!this.parent)
                return this;
            root = this.parent;
            while (true) {
                if (root.parent) {
                    root = root.parent;
                } else {
                    break;
                }
            }
            return root;
        };
        Scope.prototype.addModule = function (name) {
            var scope;
            scope = new Scope(this);
            scope.name = name;
            return this._modules[name] = scope;
        };
        Scope.prototype.getModule = function (name) {
            return this._modules[name];
        };
        Scope.prototype.getModuleInScope = function (name) {
            return this.getModule(name) || (null != this.parent ? this.parent.getModuleInScope(name) : void 0) || void 0;
        };
        Scope.prototype.resolveNamespace = function (ref, autoCreate) {
            var cur, mod, moduleName, ns;
            if (null == autoCreate)
                autoCreate = false;
            ns = [];
            cur = ref;
            while (true) {
                if (typeof cur === 'string') {
                    ns.unshift(cur);
                    break;
                } else {
                    ns.unshift(cur.right);
                    cur = cur.left;
                }
            }
            cur = this;
            for (var i$ = 0, length$ = ns.length; i$ < length$; ++i$) {
                moduleName = ns[i$];
                mod = cur.getModuleInScope(moduleName);
                if (!mod)
                    if (autoCreate) {
                        mod = cur.addModule(moduleName);
                    } else {
                        return null;
                    }
                cur = mod;
            }
            return cur;
        };
        Scope.prototype.addPrimitiveType = function (node) {
            if (node.nodeType !== 'primitiveIdentifier')
                throw 'nodeType isnt primitiveIdentifier';
            this.types.push(node);
            return node;
        };
        Scope.prototype.addStructType = function (structNode) {
            var mod, node, propName, ref;
            if (structNode.nodeType !== 'struct')
                throw 'node isnt structNode';
            ref = structNode.identifier.identifier.typeRef;
            if (_.isString(ref)) {
                mod = this;
                propName = ref;
            } else {
                mod = this.resolveNamespace(ref.left, true);
                propName = ref.right;
            }
            node = _.clone(structNode);
            node.identifier.typeRef = propName;
            delete node.data;
            delete node.line;
            delete node.offset;
            delete node.column;
            delete node.raw;
            node = {
                nodeType: 'struct',
                identifier: { typeRef: propName },
                members: node.typeAnnotation
            };
            return mod.types.push(node);
        };
        Scope.prototype.getTypeByString = function (typeName) {
            var ret;
            ret = _.find(this.types, function (i) {
                return i.identifier.typeRef === typeName;
            });
            return ret.nodeType === 'struct' ? ret.members : ret;
        };
        Scope.prototype.getTypeByMemberAccess = function (typeRef) {
            var mod, ns, property, ret;
            ns = typeRef.left;
            property = typeRef.right;
            mod = this.resolveNamespace(ns);
            ret = _.find(mod.types, function (node) {
                return node.identifier.typeRef === property;
            });
            return ret.nodeType === 'struct' ? ret.members : ret;
        };
        Scope.prototype.getType = function (typeRef) {
            if (_.isString(typeRef)) {
                return this.getTypeByString(typeRef);
            } else if ((null != typeRef ? typeRef.nodeType : void 0) === 'MemberAccess') {
                return this.getTypeByMemberAccess(typeRef);
            }
        };
        Scope.prototype.getTypeInScope = function (typeRef) {
            return this.getType(typeRef) || (null != this.parent ? this.parent.getTypeInScope(typeRef) : void 0) || null;
        };
        Scope.prototype.getTypeByIdentifier = function (node) {
            if (node.nodeType !== 'identifier')
                throw 'node is not identifier node';
            switch (node.nodeType) {
            case 'members':
                return node;
            case 'identifier':
                return this.getTypeInScope(node.identifier.typeRef);
            }
        };
        Scope.prototype.addThis = function (symbol, typeRef) {
            var n, obj, replacer, rewrite_to, T, t;
            if (null != (null != typeRef ? typeRef._base_ : void 0)) {
                T = this.getType(typeRef._base_);
                if (!T)
                    return void 0;
                obj = clone(T.typeRef);
                if (T._templates_) {
                    rewrite_to = typeRef._templates_;
                    replacer = {};
                    for (var i$ = 0, length$ = T._templates_.length; i$ < length$; ++i$) {
                        t = T._templates_[i$];
                        n = i$;
                        replacer[t] = rewrite_to[n];
                    }
                    rewrite(obj, replacer);
                }
                return this._this[symbol] = { typeRef: obj };
            } else {
                return this._this[symbol] = { typeRef: typeRef };
            }
        };
        Scope.prototype.getThis = function (symbol) {
            return this._this[symbol];
        };
        Scope.prototype.addVar = function (type, args) {
            if (null == args)
                args = [];
            this.vars.push(type);
            return debug('addVar', type);
        };
        Scope.prototype.getVar = function (typeName) {
            return _.find(this.vars, function (v) {
                return v.identifier.typeRef === typeName;
            });
        };
        Scope.prototype.getVarInScope = function (typeName) {
            return this.getVar(typeName) || (null != this.parent ? this.parent.getVarInScope(typeName) : void 0) || void 0;
        };
        Scope.prototype.checkAcceptableObject = function (left, right) {
            return false;
        };
        return Scope;
    }();
    ClassScope = function (super$) {
        extends$(ClassScope, super$);
        function ClassScope() {
            super$.apply(this, arguments);
        }
        ;
        return ClassScope;
    }(Scope);
    FunctionScope = function (super$1) {
        extends$(FunctionScope, super$1);
        function FunctionScope() {
            super$1.apply(this, arguments);
        }
        ;
        return FunctionScope;
    }(Scope);
    primitives = {
        AnyType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'Any',
                isPrimitive: true
            }
        },
        StringType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'String',
                isPrimitive: true
            }
        },
        BooleanType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'Boolean',
                isPrimitive: true
            }
        },
        IntType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'Int',
                isPrimitive: true
            }
        },
        FloatType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'Float',
                isPrimitive: true
            },
            heritages: {
                extend: {
                    identifier: {
                        typeRef: 'Int',
                        isPrimitive: true
                    }
                }
            }
        },
        NumberType: {
            nodeType: 'primitiveIdentifier',
            identifier: {
                typeRef: 'Number',
                isPrimitive: true
            },
            heritages: {
                extend: {
                    identifier: {
                        typeRef: 'Float',
                        isPrimitive: true
                    }
                }
            }
        }
    };
    initializeGlobalTypes = function (node) {
        node.addPrimitiveType(primitives.AnyType);
        node.addPrimitiveType(primitives.StringType);
        node.addPrimitiveType(primitives.IntType);
        node.addPrimitiveType(primitives.FloatType);
        node.addPrimitiveType(primitives.NumberType);
        return node.addPrimitiveType(primitives.BooleanType);
    };
    module.exports = {
        initializeGlobalTypes: initializeGlobalTypes,
        primitives: primitives,
        Scope: Scope,
        ClassScope: ClassScope,
        FunctionScope: FunctionScope
    };
    function isOwn$(o, p) {
        return {}.hasOwnProperty.call(o, p);
    }
    function extends$(child, parent) {
        for (var key in parent)
            if (isOwn$(parent, key))
                child[key] = parent[key];
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    }
}.call(this);