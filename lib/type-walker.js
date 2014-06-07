void function () {
    var _, cache$, cache$1, checkNodes, checkType, ClassScope, CS, debug, FunctionScope, ImplicitAnyAnnotation, initializeGlobalTypes, isAcceptable, reporter, same, Scope, typeErrorText, walk, walkArrayInializer, walkAssignOp, walkBinOp, walkBlock, walkBool, walkClass, walkClassProtoAssignOp, walkConditional, walkFloat, walkFor, walkFunction, walkFunctionApplication, walkIdentifier, walkInt, walkMemberAccess, walkNewOp, walkNumbers, walkObjectInitializer, walkPrimitives, walkProgram, walkRange, walkReturn, walkString, walkStruct, walkSwitch, walkThis, walkVardef;
    debug = require('./helpers').debug;
    reporter = require('./reporter');
    CS = require('./nodes');
    _ = require('lodash');
    cache$ = require('./type-checker');
    isAcceptable = cache$.isAcceptable;
    checkType = cache$.checkType;
    ImplicitAnyAnnotation = {
        implicit: true,
        isPrimitive: true,
        nodeType: 'primitiveIdentifier',
        identifier: { typeRef: 'Any' }
    };
    same = function () {
        var args, i, len, list, n;
        args = arguments.length > 0 ? [].slice.call(arguments, 0) : [];
        len = args.length;
        for (var i$ = 0, length$ = args.length; i$ < length$; ++i$) {
            i = args[i$];
            n = i$;
            if (!(n !== len - 1))
                continue;
            list = i;
        }
        return _.all(list, _.last(args));
    };
    typeErrorText = function (left, right) {
        var util;
        util = require('util');
        return 'TypeError: \n' + util.inspect(left, false, null) + ' \n to \n ' + util.inspect(right, false, null);
    };
    cache$1 = require('./types');
    initializeGlobalTypes = cache$1.initializeGlobalTypes;
    Scope = cache$1.Scope;
    ClassScope = cache$1.ClassScope;
    FunctionScope = cache$1.FunctionScope;
    checkNodes = function (cs_ast) {
        var g, root;
        g = 'undefined' !== typeof window && null != window ? window : global;
        if (!(null != (null != cs_ast.body ? cs_ast.body.statements : void 0)))
            return;
        if (g._root_) {
            root = g._root_;
        } else {
            g._root_ = root = new Scope();
            root.name = 'root';
            initializeGlobalTypes(root);
        }
        walk(cs_ast, root);
        return root;
    };
    walkStruct = function (node, scope) {
        return scope.addStructType(node);
    };
    walkVardef = function (node, scope) {
        var symbol;
        symbol = node.name.identifier.typeRef;
        if (scope instanceof ClassScope) {
            if (symbol === 'constructor')
                symbol = '_constructor_';
            return;
            return scope.addThis(symbol, node.expr);
        } else {
            return scope.addVar({
                nodeType: 'variable',
                identifier: { typeRef: symbol },
                typeAnnotation: node.expr
            });
        }
    };
    walkProgram = function (node, scope) {
        walk(node.body.statements, scope);
        return node.typeAnnotation = { identifier: 'Program' };
    };
    walkBlock = function (node, scope) {
        var last_typeAnnotation;
        walk(node.statements, scope);
        last_typeAnnotation = null != node.statements[node.statements.length - 1] ? node.statements[node.statements.length - 1].typeAnnotation : void 0;
        return node.typeAnnotation = last_typeAnnotation;
    };
    walkReturn = function (node, scope) {
        return;
        walk(node.expression, scope);
        if (null != (null != node.expression && null != node.expression.typeAnnotation ? node.expression.typeAnnotation.identifier : void 0)) {
            scope.addReturnable(node.expression.typeAnnotation.identifier);
            return node.typeAnnotation = node.expression.typeAnnotation;
        }
    };
    walkBinOp = function (node, scope) {
        var cache$2, leftAnnotation, leftRef, rightAnnotation, rightRef;
        walk(node.left, scope);
        walk(node.right, scope);
        cache$2 = [
            node.left.typeAnnotation,
            node.right.typeAnnotation
        ].map(function (node) {
            if (node.nodeType === 'identifier') {
                return scope.getTypeByIdentifier(node);
            } else if (node.nodeType === 'primitiveIdentifier') {
                return node;
            } else if (node.nodeType === 'members') {
                return node;
            } else if (node.nodeType === 'functionType') {
                return node;
            } else {
                throw (null != node ? node.nodeType : void 0) + ' is not registered nodeType';
            }
        });
        leftAnnotation = cache$2[0];
        rightAnnotation = cache$2[1];
        leftRef = null != leftAnnotation ? leftAnnotation.identifier.typeRef : void 0;
        rightRef = null != rightAnnotation ? rightAnnotation.identifier.typeRef : void 0;
        if (leftRef && rightRef) {
            if (leftRef === 'String' || rightRef === 'String') {
                return node.typeAnnotation = {
                    implicit: true,
                    nodeType: 'primitiveIdentifier',
                    identifier: { typeRef: 'String' }
                };
            } else if (leftRef === 'Int' && rightRef === 'Int') {
                return node.typeAnnotation = {
                    implicit: true,
                    nodeType: 'primitiveIdentifier',
                    identifier: { typeRef: 'Int' }
                };
            } else if ((leftRef === 'Int' || leftRef === 'Float') && (rightRef === 'Int' || rightRef === 'Float')) {
                return node.typeAnnotation = {
                    implicit: true,
                    nodeType: 'primitiveIdentifier',
                    identifier: { typeRef: 'Float' }
                };
            } else if ((leftRef === 'Int' || leftRef === 'Float' || leftRef === 'Number') && (rightRef === 'Int' || rightRef === 'Float' || rightRef === 'Number')) {
                return node.typeAnnotation = {
                    implicit: true,
                    nodeType: 'primitiveIdentifier',
                    identifier: { typeRef: 'Number' }
                };
            } else if (leftRef === rightRef && rightRef === 'Any') {
                console.error('aafdafda', node.className);
                if (node instanceof CS.PlusOp) {
                    return node.typeAnnotation = {
                        implicit: true,
                        nodeType: 'primitiveIdentifier',
                        identifier: { typeRef: 'Any' }
                    };
                } else {
                    return node.typeAnnotation = {
                        implicit: true,
                        nodeType: 'primitiveIdentifier',
                        identifier: { typeRef: 'Number' }
                    };
                }
            }
        } else {
            return node.typeAnnotation = ImplicitAnyAnnotation;
        }
    };
    walkConditional = function (node, scope) {
        var alternate_typeAnnotation, identifier, possibilities, typeAnnotation;
        return;
        walk(node.condition, scope);
        walk(node.consequent, scope);
        if (null != node.alternate)
            walk(node.alternate, scope);
        alternate_typeAnnotation = null != (null != node.alternate ? node.alternate.typeAnnotation : void 0) ? null != node.alternate ? node.alternate.typeAnnotation : void 0 : { identifier: 'Undefined' };
        possibilities = [];
        for (var cache$2 = [
                    null != node.consequent ? node.consequent.typeAnnotation : void 0,
                    alternate_typeAnnotation
                ], i$ = 0, length$ = cache$2.length; i$ < length$; ++i$) {
            typeAnnotation = cache$2[i$];
            if (!('undefined' !== typeof typeAnnotation && null != typeAnnotation))
                continue;
            if (null != (null != typeAnnotation.identifier ? typeAnnotation.identifier.possibilities : void 0)) {
                for (var i$1 = 0, length$1 = typeAnnotation.identifier.possibilities.length; i$1 < length$1; ++i$1) {
                    identifier = typeAnnotation.identifier.possibilities[i$1];
                    possibilities.push(identifier);
                }
            } else if (null != typeAnnotation.identifier) {
                possibilities.push(typeAnnotation.identifier);
            }
        }
        return node.typeAnnotation = { identifier: { possibilities: possibilities } };
    };
    walkSwitch = function (node, scope) {
        var alternate_typeAnnotation, c, cond, possibilities;
        return;
        walk(node.expression, scope);
        for (var i$ = 0, length$ = node.cases.length; i$ < length$; ++i$) {
            c = node.cases[i$];
            for (var i$1 = 0, length$1 = c.conditions.length; i$1 < length$1; ++i$1) {
                cond = c.conditions[i$1];
                walk(c, scope);
            }
            walk(c.consequent, scope);
        }
        walk(node.consequent, scope);
        if (null != node.alternate)
            walk(node.alternate, scope);
        alternate_typeAnnotation = null != (null != node.alternate ? node.alternate.typeAnnotation : void 0) ? null != node.alternate ? node.alternate.typeAnnotation : void 0 : { identifier: 'Undefined' };
        possibilities = [];
        for (var i$2 = 0, length$2 = node.cases.length; i$2 < length$2; ++i$2) {
            c = node.cases[i$2];
            if (!(null != c.typeAnnotation))
                continue;
            possibilities.push(c.consequent.typeAnnotation);
        }
        possibilities.push(alternate_typeAnnotation.identifier);
        return node.typeAnnotation = { identifier: { possibilities: possibilities } };
    };
    walkNewOp = function (node, scope) {
        var arg, args, err, Type;
        return;
        for (var i$ = 0, length$ = node['arguments'].length; i$ < length$; ++i$) {
            arg = node['arguments'][i$];
            walk(arg, scope);
        }
        Type = scope.getTypeInScope(node.ctor.data);
        if (Type) {
            args = null != node['arguments'] ? node['arguments'].map(function (arg) {
                return null != arg.typeAnnotation ? arg.typeAnnotation.identifier : void 0;
            }) : void 0;
            if (err = scope.checkAcceptableObject(Type.identifier._constructor_, {
                    'arguments': null != args ? args : [],
                    returnType: 'Any'
                })) {
                err = typeErrorText(Type.identifier._constructor_, {
                    'arguments': null != args ? args : [],
                    returnType: 'Any'
                });
                return reporter.add_error(node, err);
            }
        }
        return node.typeAnnotation = { identifier: null != Type ? Type.identifier : void 0 };
    };
    walkFor = function (node, scope) {
        var err, identifier, nop;
        return;
        walk(node.target, scope);
        if (null != node.valAssignee)
            scope.addVar(node.valAssignee.data, null != (null != node.valAssignee && null != node.valAssignee.typeAnnotation ? node.valAssignee.typeAnnotation.identifier : void 0) ? null != node.valAssignee && null != node.valAssignee.typeAnnotation ? node.valAssignee.typeAnnotation.identifier : void 0 : 'Any');
        if (null != node.keyAssignee)
            scope.addVar(node.keyAssignee.data, null != (null != node.keyAssignee && null != node.keyAssignee.typeAnnotation ? node.keyAssignee.typeAnnotation.identifier : void 0) ? null != node.keyAssignee && null != node.keyAssignee.typeAnnotation ? node.keyAssignee.typeAnnotation.identifier : void 0 : 'Any');
        if (null != node.valAssignee)
            if (null != (null != node.target.typeAnnotation && null != node.target.typeAnnotation.identifier ? node.target.typeAnnotation.identifier.array : void 0)) {
                if (err = scope.checkAcceptableObject(node.valAssignee.typeAnnotation.identifier, node.target.typeAnnotation.identifier.array)) {
                    err = typeErrorText(node.valAssignee.typeAnnotation.identifier, node.target.typeAnnotation.identifier.array);
                    return reporter.add_error(node, err);
                }
            } else if ((null != node.target && null != node.target.typeAnnotation ? node.target.typeAnnotation.identifier : void 0) instanceof Object) {
                if (node.target.typeAnnotation.identifier instanceof Object)
                    for (nop in node.target.typeAnnotation.identifier) {
                        identifier = node.target.typeAnnotation.identifier[nop];
                        if (err = scope.checkAcceptableObject(node.valAssignee.typeAnnotation.identifier, identifier)) {
                            err = typeErrorText(node.valAssignee.typeAnnotation.identifier, identifier);
                            return reporter.add_error(node, err);
                        }
                    }
            }
        walk(node.body, scope);
        node.typeAnnotation = null != node.target ? node.target.typeAnnotation : void 0;
        delete scope._vars[null != node.valAssignee ? node.valAssignee.data : void 0];
        return delete scope._vars[null != node.keyAssignee ? node.keyAssignee.data : void 0];
    };
    walkClassProtoAssignOp = function (node, scope) {
        var left, right, symbol;
        return;
        left = node.assignee;
        right = node.expression;
        symbol = left.data;
        walk(left, scope);
        if (right['instanceof'](CS.Function) && scope.getThis(symbol)) {
            walkFunction(right, scope, scope.getThis(symbol).identifier);
        } else {
            walk(right, scope);
        }
        symbol = left.data;
        if (null != right.typeAnnotation)
            return scope.addThis(symbol, right.typeAnnotation.identifier);
    };
    walkAssignOp = function (node, scope) {
        var left, preAnnotation, right, symbol, v;
        left = node.assignee;
        right = node.expression;
        symbol = left.data;
        preAnnotation = left.typeAnnotation;
        walk(left, scope);
        if (right['instanceof'](CS.Function) && scope.getVarInScope(symbol)) {
            v = scope.getVarInScope(symbol);
            walkFunction(right, scope, v.typeAnnotation);
        } else {
            walk(right, scope);
        }
        if (left['instanceof'](CS.ArrayInitialiser)) {
            return;
        } else if (null != (null != left ? left.members : void 0)) {
            return;
        } else if (left['instanceof'](CS.MemberAccessOp)) {
            if (!checkType(scope, node, left, right))
                return;
        } else if (left['instanceof'](CS.Identifier)) {
            if (scope.getVarInScope(symbol) && preAnnotation)
                return reporter.add_error(node, 'double bind: ' + symbol);
            if (null != left.typeAnnotation && null != right.typeAnnotation)
                if (null != (null != left.typeAnnotation ? left.typeAnnotation.properties : void 0)) {
                    if (!checkType(scope, node, left, right))
                        return;
                } else if (!checkType(scope, node, left, right))
                    return;
            if (null != preAnnotation) {
                return scope.addVar({
                    nodeType: 'variable',
                    identifier: { typeRef: symbol },
                    typeAnnotation: preAnnotation
                });
            } else if (!right.typeAnnotation.implicit && left.typeAnnotation.implicit) {
                left.typeAnnotation = right.typeAnnotation;
                return scope.addVar({
                    nodeType: 'variable',
                    identifier: { typeRef: symbol },
                    typeAnnotation: right.typeAnnotation
                });
            } else {
                scope.addVar({
                    nodeType: 'variable',
                    identifier: { typeRef: symbol },
                    typeAnnotation: ImplicitAnyAnnotation
                });
                if (null != left.typeAnnotation)
                    return left.typeAnnotation;
                else
                    return left.typeAnnotation = ImplicitAnyAnnotation;
            }
        } else {
            throw 'unexpected node:' + (null != node ? node.className : void 0);
        }
    };
    walkPrimitives = function (node, scope) {
        switch (false) {
        case !node['instanceof'](CS.String):
            return walkString(node, scope);
        case !node['instanceof'](CS.Bool):
            return walkBool(node, scope);
        case !node['instanceof'](CS.Int):
            return walkInt(node, scope);
        case !node['instanceof'](CS.Float):
            return walkFloat(node, scope);
        case !node['instanceof'](CS.Numbers):
            return walkNumbers(node, scope);
        }
    };
    walkString = function (node, scope) {
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                implicit: true,
                nodeType: 'primitiveIdentifier',
                isPrimitive: true,
                identifier: { typeRef: 'String' }
            };
    };
    walkInt = function (node, scope) {
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                implicit: true,
                nodeType: 'primitiveIdentifier',
                isPrimitive: true,
                identifier: { typeRef: 'Int' }
            };
    };
    walkBool = function (node, scope) {
        return;
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                nodeType: 'primitiveIdentifier',
                isPrimitive: true,
                identifier: { typeRef: 'Boolean' }
            };
    };
    walkFloat = function (node, scope) {
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                implicit: true,
                nodeType: 'primitiveIdentifier',
                isPrimitive: true,
                identifier: { typeRef: 'Float' },
                heritages: {
                    extend: {
                        identifier: {
                            typeRef: 'Int',
                            isArray: false
                        }
                    }
                }
            };
    };
    walkNumbers = function (node, scope) {
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                nodeType: 'primitiveIdentifier',
                isPrimitive: true,
                identifier: { typeRef: 'Number' },
                heritages: { extend: { identifier: { typeRef: 'Float' } } }
            };
    };
    walkIdentifier = function (node, scope) {
        var cache$2, typeAnnotation, typeName;
        typeName = node.data;
        if (scope.getVarInScope(typeName)) {
            typeAnnotation = null != (cache$2 = scope.getVarInScope(typeName)) ? cache$2.typeAnnotation : void 0;
            return node.typeAnnotation = null != typeAnnotation ? typeAnnotation : ImplicitAnyAnnotation;
        } else if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = ImplicitAnyAnnotation;
    };
    walkThis = function (node, scope) {
        var identifier, key, val;
        return;
        identifier = {};
        for (key in scope._this) {
            val = scope._this[key];
            identifier[key] = val.identifier;
        }
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = { identifier: identifier };
    };
    walkMemberAccess = function (node, scope) {
        var member, type;
        if (node['instanceof'](CS.MemberAccessOp))
            walk(node.expression, scope);
        type = scope.getTypeByIdentifier(node.expression.typeAnnotation);
        if (type) {
            member = _.find(type.properties, function (prop) {
                return (null != prop.identifier ? prop.identifier.typeRef : void 0) === node.memberName;
            });
            node.typeAnnotation = null != (null != member ? member.typeAnnotation : void 0) ? null != member ? member.typeAnnotation : void 0 : ImplicitAnyAnnotation;
        } else if (null != node.typeAnnotation)
            node.typeAnnotation;
        else
            node.typeAnnotation = ImplicitAnyAnnotation;
        return debug('walkMemberAccess', node);
    };
    walkArrayInializer = function (node, scope) {
        return;
        walk(node.members, scope);
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                identifier: {
                    array: null != node.members ? node.members.map(function (m) {
                        return null != m.typeAnnotation ? m.typeAnnotation.identifier : void 0;
                    }) : void 0
                }
            };
    };
    walkRange = function (node, scope) {
        return;
        return node.typeAnnotation = { identifier: { array: 'Number' } };
    };
    walkObjectInitializer = function (node, scope) {
        var cache$2, expression, key, nextScope, obj, props;
        obj = {};
        nextScope = new Scope(scope);
        nextScope.name = 'object';
        props = [];
        for (var i$ = 0, length$ = node.members.length; i$ < length$; ++i$) {
            {
                cache$2 = node.members[i$];
                expression = cache$2.expression;
                key = cache$2.key;
            }
            if (!('undefined' !== typeof key && null != key))
                continue;
            walk(expression, nextScope);
            props.push({
                implicit: true,
                identifier: { typeRef: key.data },
                nodeType: 'identifier',
                typeAnnotation: expression.typeAnnotation
            });
        }
        if (null != node.typeAnnotation)
            return node.typeAnnotation;
        else
            return node.typeAnnotation = {
                properties: props,
                nodeType: 'members',
                implicit: true,
                heritages: {
                    extend: {
                        implicit: true,
                        nodeType: 'identifier',
                        identifier: { typeRef: 'Object' }
                    }
                }
            };
    };
    walkClass = function (node, scope) {
        var classScope, cls, constructorScope, fname, index, key, name, param, parent, preAnnotation, statement, this_scope, val;
        return;
        classScope = new ClassScope(scope);
        this_scope = {};
        if (null != node.nameAssignee ? node.nameAssignee.data : void 0) {
            if (null != node.parent ? node.parent.data : void 0) {
                parent = scope.getTypeInScope(node.parent.data);
                if (parent)
                    for (key in parent.identifier) {
                        val = parent.identifier[key];
                        this_scope[key] = val;
                    }
            }
            if (null != (null != node.impl ? node.impl.length : void 0))
                for (var i$ = 0, length$ = node.impl.length; i$ < length$; ++i$) {
                    name = node.impl[i$];
                    cls = scope.getTypeInScope(name);
                    if (cls)
                        for (key in cls.identifier) {
                            val = cls.identifier[key];
                            this_scope[key] = val;
                        }
                }
        }
        if (null != (null != node.body ? node.body.statements : void 0))
            for (var i$1 = 0, length$1 = node.body.statements.length; i$1 < length$1; ++i$1) {
                statement = node.body.statements[i$1];
                if (!(statement.identifier === 'vardef'))
                    continue;
                walkVardef(statement, classScope);
            }
        if (null != node.ctor) {
            constructorScope = new FunctionScope(classScope);
            constructorScope._this = classScope._this;
            if (null != node.ctor.expression.parameters)
                if (constructorScope.getThis('_constructor_')) {
                    preAnnotation = constructorScope.getThis('_constructor_').identifier;
                    for (var i$2 = 0, length$2 = node.ctor.expression.parameters.length; i$2 < length$2; ++i$2) {
                        param = node.ctor.expression.parameters[i$2];
                        index = i$2;
                        if (!('undefined' !== typeof param && null != param))
                            continue;
                        walk(param, constructorScope);
                        constructorScope.addVar(param.data, null != (null != preAnnotation['arguments'] ? preAnnotation['arguments'][index] : void 0) ? null != preAnnotation['arguments'] ? preAnnotation['arguments'][index] : void 0 : 'Any');
                    }
                } else {
                    for (var i$3 = 0, length$3 = node.ctor.expression.parameters.length; i$3 < length$3; ++i$3) {
                        param = node.ctor.expression.parameters[i$3];
                        index = i$3;
                        if (!(null != param))
                            continue;
                        walk(param, constructorScope);
                        constructorScope.addVar(param.data, null != (null != param && null != param.typeAnnotation ? param.typeAnnotation.identifier : void 0) ? null != param && null != param.typeAnnotation ? param.typeAnnotation.identifier : void 0 : 'Any');
                    }
                }
            if (null != (null != node.ctor.expression.body ? node.ctor.expression.body.statements : void 0))
                for (var i$4 = 0, length$4 = node.ctor.expression.body.statements.length; i$4 < length$4; ++i$4) {
                    statement = node.ctor.expression.body.statements[i$4];
                    walk(statement, constructorScope);
                }
        }
        if (null != (null != node.body ? node.body.statements : void 0))
            for (var i$5 = 0, length$5 = node.body.statements.length; i$5 < length$5; ++i$5) {
                statement = node.body.statements[i$5];
                if (!(statement.identifier !== 'vardef'))
                    continue;
                walk(statement, classScope);
            }
        if (null != node.nameAssignee ? node.nameAssignee.data : void 0) {
            for (fname in classScope._this) {
                val = classScope._this[fname];
                this_scope[fname] = val.identifier;
            }
            return scope.addType(node.nameAssignee.data, this_scope);
        }
    };
    walkFunction = function (node, scope, preAnnotation) {
        var err, functionScope, hasError;
        if (null == preAnnotation)
            preAnnotation = null;
        functionScope = new Scope(scope);
        if (scope instanceof ClassScope)
            functionScope._this = scope._this;
        if (null != preAnnotation) {
            hasError = false;
            node.typeAnnotation = preAnnotation;
            if (null != node.parameters)
                node.parameters.map(function (param, n) {
                    var err;
                    if (null != param.typeAnnotation)
                        if (!isAcceptable(scope, preAnnotation['arguments'][n], param.typeAnnotation)) {
                            typeErrorText = function (left, right) {
                                var util;
                                util = require('util');
                                return 'TypeError: \n' + util.inspect(left, false, null) + ' \n to \n ' + util.inspect(right, false, null);
                            };
                            err = typeErrorText(preAnnotation['arguments'][n], param.typeAnnotation);
                            hasError = true;
                            return reporter.add_error(node, err);
                        }
                    if (null != param.typeAnnotation)
                        param.typeAnnotation;
                    else
                        param.typeAnnotation = preAnnotation['arguments'][n];
                    return scope.addVar({
                        nodeType: 'variable',
                        identifier: { typeRef: param.data },
                        typeAnnotation: param.typeAnnotation
                    });
                });
            if (hasError)
                return;
        } else if (null != node.parameters)
            node.parameters.map(function (param, n) {
                return scope.addVar({
                    nodeType: 'variable',
                    identifier: { typeRef: param.data },
                    typeAnnotation: null != param.typeAnnotation ? param.typeAnnotation : ImplicitAnyAnnotation
                });
            });
        walk(node.body, functionScope);
        debug('left', node.body.typeAnnotation);
        debug('right', node.typeAnnotation.returnType);
        if (null != node.body.typeAnnotation)
            node.body.typeAnnotation;
        else
            node.body.typeAnnotation = ImplicitAnyAnnotation;
        if (null != node.typeAnnotation.returnType)
            node.typeAnnotation.returnType;
        else
            node.typeAnnotation.returnType = ImplicitAnyAnnotation;
        if (!isAcceptable(scope, node.body.typeAnnotation, node.typeAnnotation.returnType)) {
            typeErrorText = function (left, right) {
                var util;
                util = require('util');
                return 'TypeError: \n' + util.inspect(left, false, null) + ' \n to \n ' + util.inspect(right, false, null);
            };
            err = typeErrorText(node.body.typeAnnotation, node.typeAnnotation.returnType);
            return reporter.add_error(node, err);
        }
    };
    walkFunctionApplication = function (node, scope) {
        var arg, err, left, n, right;
        for (var i$ = 0, length$ = node['arguments'].length; i$ < length$; ++i$) {
            arg = node['arguments'][i$];
            walk(arg, scope);
        }
        walk(node['function'], scope);
        node.typeAnnotation = null != (null != node['function'].typeAnnotation ? node['function'].typeAnnotation.returnType : void 0) ? null != node['function'].typeAnnotation ? node['function'].typeAnnotation.returnType : void 0 : ImplicitAnyAnnotation;
        debug('FunctionApplication', node);
        return function (accum$) {
            for (var i$1 = 0, length$1 = node['arguments'].length; i$1 < length$1; ++i$1) {
                arg = node['arguments'][i$1];
                n = i$1;
                left = null != node['function'].typeAnnotation && null != node['function'].typeAnnotation['arguments'] ? node['function'].typeAnnotation['arguments'][n] : void 0;
                right = null != arg ? arg.typeAnnotation : void 0;
                accum$.push(left && right ? !isAcceptable(scope, left, right) ? (typeErrorText = function (left, right) {
                    var util;
                    util = require('util');
                    return 'TypeError: \n' + util.inspect(left, false, null) + ' \n to \n ' + util.inspect(right, false, null);
                }, err = typeErrorText(left, right), reoprter.add_error(node, err)) : void 0 : void 0);
            }
            return accum$;
        }.call(this, []);
    };
    walk = function (node, scope) {
        var s;
        console.error('walking node:', null != node ? node.className : void 0);
        switch (false) {
        case !!(null != node):
            return;
        case !(null != node.length):
            return function (accum$) {
                for (var i$ = 0, length$ = node.length; i$ < length$; ++i$) {
                    s = node[i$];
                    accum$.push(walk(s, scope));
                }
                return accum$;
            }.call(this, []);
        case !(node.nodeType === 'struct'):
            return walkStruct(node, scope);
        case !(node.nodeType === 'vardef'):
            return walkVardef(node, scope);
        case !node['instanceof'](CS.Program):
            return walkProgram(node, scope);
        case !node['instanceof'](CS.Block):
            return walkBlock(node, scope);
        case !node['instanceof'](CS.Return):
            return walkReturn(node, scope);
        case !node['instanceof'](CS.NewOp):
            return walkNewOp(node, scope);
        case !(node['instanceof'](CS.PlusOp) || node['instanceof'](CS.MultiplyOp) || node['instanceof'](CS.DivideOp) || node['instanceof'](CS.SubtractOp)):
            return walkBinOp(node, scope);
        case !node['instanceof'](CS.Switch):
            return walkSwitch(node, scope);
        case !node['instanceof'](CS.Conditional):
            return walkConditional(node, scope);
        case !(node['instanceof'](CS.ForIn) || node['instanceof'](CS.ForOf)):
            return walkFor(node, scope);
        case !node['instanceof'](CS.Primitives):
            return walkPrimitives(node, scope);
        case !node['instanceof'](CS.This):
            return walkThis(node, scope);
        case !node['instanceof'](CS.Identifier):
            return walkIdentifier(node, scope);
        case !node['instanceof'](CS.ClassProtoAssignOp):
            return walkClassProtoAssignOp(node, scope);
        case !node['instanceof'](CS.MemberAccessOps):
            return walkMemberAccess(node, scope);
        case !node['instanceof'](CS.ArrayInitialiser):
            return walkArrayInializer(node, scope);
        case !node['instanceof'](CS.Range):
            return walkRange(node, scope);
        case !node['instanceof'](CS.ObjectInitialiser):
            return walkObjectInitializer(node, scope);
        case !node['instanceof'](CS.Class):
            return walkClass(node, scope);
        case !node['instanceof'](CS.Function):
            return walkFunction(node, scope);
        case !node['instanceof'](CS.FunctionApplication):
            return walkFunctionApplication(node, scope);
        case !node['instanceof'](CS.AssignOp):
            return walkAssignOp(node, scope);
        }
    };
    module.exports = { checkNodes: checkNodes };
}.call(this);