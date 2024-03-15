import type {
    ExposeDscr,
    ExposeGraph,
    ExposeMode,
    PropertyDefinition,
    SerializationContext,
    SerializationOptions,
    TransformerFn,
    TransformerFnParams,
    TypeDefinition,
} from './def.js';
import { Direction, Strategy } from './def.js';
import { Exception, getClassesFromChain } from './helpers/index.js';
import { MetadataStorage } from './MetadataStorage.js';


type Options = {
    typeProperty? : string;
}

type ExpositionCalcResult = [ ExposeMode, boolean, ExposeGraph<any>? ];


export class Serializer
{
    
    protected _metadataStorage : MetadataStorage = MetadataStorage.getSingleton();
    
    protected _typeProperty : string = '@type';
    
    protected _initiated : boolean = false;
    
    
    public init (options : Options = {})
    {
        if (this._initiated) {
            throw new Exception(
                'Serializer already initiated',
                1709577709189
            );
        }
        
        if (options.typeProperty) {
            this._typeProperty = options.typeProperty;
        }
        
        this._initiated = true;
    }
    
    
    public getTypeName (type : any) : any
    {
        const typeDef = this._metadataStorage.getTypeDefinition(type);
        if (!typeDef) {
            throw new Exception(
                'Unknown type: ' + type.name,
                1710478992800
            );
        }
        
        return typeDef?.name;
    }
    
    public getTypeByName (typeName : string) : any
    {
        const type = this._metadataStorage.getTypeByName(typeName);
        if (!type) {
            throw new Exception(
                'Unknown type name: ' + typeName,
                1710479570120
            );
        }
        
        return type;
    }
    
    
    public toPlain<T> (
        source : T,
        options : SerializationOptions.ToPlain<T> = {}
    ) : any
    {
        const context : SerializationContext.ToPlain<T> = {};
        
        // prepare options
        if (options.strategy === undefined) {
            if (options.graph !== undefined) {
                options.strategy = Strategy.Graph;
            }
            else {
                options.strategy = Strategy.Exclude;
            }
        }
        if (options.excludePrefixes === undefined) {
            options.excludePrefixes = [];
        }
        
        // prepare context
        if (context.depth === undefined) {
            context.depth = 0;
        }
        if (context.path === undefined) {
            context.path = '';
        }
        if (context.graph === undefined) {
            context.graph = options.graph ?? false;
        }
        if (context.circular === undefined) {
            context.circular = [];
        }
        
        // move type and ctxData to context
        if (options.ctxData) {
            context.data = options.ctxData;
            delete options.ctxData;
        }
        
        context.groups = options.groups ?? [];
        delete options.groups;
        
        return this._toPlain(source, options, context);
    }
    
    protected _toPlain<T> (
        source : T,
        options : SerializationOptions.ToPlain<T> = {},
        context : SerializationContext.ToPlain<T> = {}
    ) : any
    {
        // check depth limit
        if (
            options.depth !== undefined
            && context.depth >= options.depth
        ) {
            return undefined;
        }
        
        // detect type
        const chainClasses = getClassesFromChain(source?.constructor);
        
        let type : any = null;
        if (context.type) {
            // type restricted by context (parent)
            type = chainClasses.includes(context.type) // allow only classes from the same chain
                ? source.constructor
                : context.type
            ;
        }
        else {
            // pick actual class if not restricted
            type = source?.constructor;
        }
        
        // get type definition
        const typeDef = type
            ? this._metadataStorage.getTypeDefinition(type)
            : null
        ;
        
        // catch circular dependencies
        if (context.circular.includes(source)) {
            if (typeDef) {
                return this._toPlainCircular(source, typeDef);
            }
            else {
                return undefined;
            }
        }
        
        // auto groups
        if (typeDef?.autoGroups) {
            for (const autoGroupEntry of typeDef.autoGroups) {
                const pass = autoGroupEntry.fn(source, context.data, context);
                if (pass) {
                    // update current branch options
                    context.groups = [
                        ...context.groups,
                        ...autoGroupEntry.groups,
                    ];
                }
            }
        }
        
        // catch graph serialization
        if (
            options.strategy == Strategy.Graph
            && context.graph === false
        ) {
            return undefined;
        }
        
        // transformation before
        {
            const [ value, final ] = this._transform(
                source,
                {
                    direction: Direction.ToPlain,
                    type,
                    options,
                    context,
                },
                context.transformers?.before,
                typeDef?.transformers?.toPlain?.before
            );
            
            if (final) {
                // transformation is final - return value
                return value;
            }
            else {
                source = value;
            }
        }
        
        // trivial values
        if ([ undefined, null ].includes(source)) {
            return <any>source;
        }
        
        // built in types
        if ([ undefined, null, Boolean, Number, String, BigInt, Date ].includes(type)) {
            return <any>source;
        }
        
        // verify source type
        if (!(source instanceof Object)) {
            // at this stage non object types could not be transformed
            // transformer may be required to handle this case
            return undefined;
        }
        
        // build plain object
        let plain : any = {};
        
        // collect all suitable props
        const allProps = this._metadataStorage.getAllProperties(type);
        
        if (context.forceExpose) {
            // add properties from source
            Object.keys(source)
                .forEach(propKey => allProps.add(propKey));
        }
        
        // add type property
        if (typeDef) {
            if (typeDef.name) {
                plain[this._typeProperty] = typeDef.name;
            }
            if (typeDef.idProperty) {
                plain[typeDef.idProperty] = source[typeDef.idProperty];
            }
        }
        
        for (const propKey of allProps) {
            const path = (context.path ? context.path + '.' : '') + propKey.toString();
            
            const propDef : PropertyDefinition = this._metadataStorage
                .getPropertyDefinition(type, propKey);
            
            // detect non-readable prop
            const dscr = propDef?.descriptor;
            if (dscr) {
                if (dscr.set && !dscr.get) {
                    // skip
                    continue;
                }
            }
            
            // check should property be exposed
            const [ exposeMode, exposeDeeply, childGraph ] = this._calcExposition(
                propKey,
                propDef,
                options,
                context
            );
            
            if (!exposeMode) {
                // drop further processing for this prop
                continue;
            }
            
            // initially set to undefined
            let valueToSet = undefined;
            let sourceValue = source[propKey];
            
            // auto detect array type
            let propType = propDef.type;
            if (!propType) {
                if (sourceValue instanceof Array) {
                    propType = { arrayOf: () => undefined };
                }
            }
            
            // prepare child context
            const childContext : SerializationContext.ToPlain = {
                ...context,
                transformers: propDef.transformers?.toPlain,
                parent: source,
                propertyKey: propKey,
                path,
                depth: context.depth + 1,
                circular: [ ...context.circular, source ],
                graph: childGraph,
                forceExpose: context.forceExpose ?? exposeDeeply,
            };
            
            // no type case
            if (!propType) {
                valueToSet = this._toPlain(
                    sourceValue,
                    options,
                    {
                        ...childContext,
                        type: undefined
                    }
                );
            }
            // simple type specified
            else if (propType.type) {
                valueToSet = this._toPlain(
                    sourceValue,
                    options,
                    {
                        ...childContext,
                        type: propType.type(),
                    }
                );
            }
            // array of specified
            else if (propType.arrayOf) {
                if (sourceValue instanceof Array) {
                    valueToSet = [];
                    
                    for (const idx in sourceValue) {
                        valueToSet[idx] = this._toPlain(
                            sourceValue[idx],
                            options,
                            {
                                ...childContext,
                                type: propType.arrayOf(),
                                path: path + '.' + idx
                            }
                        );
                    }
                }
            }
            // record of specified
            else if (propType.recordOf) {
                if (sourceValue instanceof Object) {
                    valueToSet = {};
                    
                    for (const prop2 in sourceValue) {
                        valueToSet[prop2] = this._toPlain(
                            sourceValue[prop2],
                            options,
                            {
                                ...childContext,
                                type: propType.recordOf(),
                                path: path + '.' + prop2
                            }
                        );
                    }
                }
            }
            
            if (valueToSet !== undefined) {
                plain[propKey] = valueToSet;
            }
        }
        
        // transformation after
        {
            const [ finalValue ] = this._transform(
                plain,
                {
                    direction: Direction.ToPlain,
                    type,
                    options,
                    context,
                },
                context.transformers?.after,
                typeDef?.transformers?.toPlain?.after
            );
            
            return finalValue;
        }
    }
    
    protected _toPlainCircular<T> (
        source : T,
        typeDef : TypeDefinition
    ) : any
    {
        const plain : any = {};
        
        if (typeDef.name) {
            plain[this._typeProperty] = typeDef.name;
        }
        if (typeDef.idProperty) {
            plain[typeDef.idProperty] = source[typeDef.idProperty];
        }
        
        return plain;
    }
    
    
    public toClass<T> (
        source : any,
        options : SerializationOptions.ToClass<T> = {},
    ) : T
    {
        const context : SerializationContext.ToClass<T> = {};
        
        // prepare options
        if (options.strategy === undefined) {
            if (options.graph !== undefined) {
                options.strategy = Strategy.Graph;
            }
            else {
                options.strategy = Strategy.Exclude;
            }
        }
        if (options.excludePrefixes === undefined) {
            options.excludePrefixes = [];
        }
        
        // prepare context
        if (context.path === undefined) {
            context.path = '';
        }
        if (context.graph === undefined) {
            context.graph = options.graph ?? false;
        }
        
        // move props to context
        if (options.type) {
            if (typeof options.type == 'string') {
                const type = this._metadataStorage.getTypeByName(options.type);
                if (!type) {
                    throw new Exception(
                        'Unknown type name: ' + options.type,
                        1710478811512
                    );
                }
                
                context.type = type;
            }
            else {
                context.type = options.type;
            }
            delete options.type;
        }
        if (options.ctxData) {
            context.data = options.ctxData;
            delete options.ctxData;
        }
        
        context.groups = options.groups ?? [];
        delete options.groups;
        
        return this._toClass(source, options, context);
    }
    
    protected _toClass<T> (
        source : any,
        options : SerializationOptions.ToClass<T> = {},
        context : SerializationContext.ToClass<T> = {}
    ) : T
    {
        // catch graph serialization
        if (
            options.strategy == Strategy.Graph
            && context.graph === false
        ) {
            return undefined;
        }
        
        // detect type
        const type = this._detectTypeFromPlain(source, context);
        
        // get type definition
        const typeDef = type
            ? this._metadataStorage.getTypeDefinition(type)
            : null
        ;
        
        // auto groups
        if (typeDef?.autoGroups) {
            for (const autoGroupEntry of typeDef.autoGroups) {
                const pass = autoGroupEntry.fn(source, context.data, context);
                if (pass) {
                    // update current branch options
                    context.groups = [
                        ...context.groups,
                        ...autoGroupEntry.groups,
                    ];
                }
            }
        }
        
        // transformation before
        {
            const [ value, final ] = this._transform(
                source,
                {
                    direction: Direction.ToClass,
                    type,
                    options,
                    context,
                },
                context.transformers?.before,
                typeDef?.transformers?.toClass?.before
            );
            
            if (final) {
                // transformation is final - return value
                return value;
            }
            else {
                source = value;
            }
        }
        
        // trivial values
        if ([ undefined, null ].includes(source)) {
            return <any>source;
        }
        
        // built in types
        if ([ undefined, null, Boolean, Number, String, BigInt, Date ].includes(type)) {
            return <any>source;
        }
        
        // verify source type
        if (!(source instanceof Object)) {
            // at this stage non object types could not be transformed
            // transformer may be required to handle this case
            return undefined;
        }
        
        // create target instance
        const instance = !(source instanceof type)
            ? new type() // new instance of type
            : source // use provided instance
        ;
        
        const allProps = this._metadataStorage.getAllProperties(type);
        
        if (context.forceExpose) {
            // add properties from source
            Object.keys(source)
                .forEach(propKey => allProps.add(propKey));
        }
        
        for (const propKey of allProps) {
            const path = (context.path ? context.path + '.' : '') + propKey.toString();
            
            const propDef : PropertyDefinition = this._metadataStorage.getPropertyDefinition(
                type,
                propKey
            );
            
            // detect non-writable prop
            const dscr = propDef?.descriptor;
            if (dscr) {
                if (dscr.get && !dscr.set) {
                    // skip
                    continue;
                }
            }
            
            let valueToSet = instance[propKey];
            
            // check should property be exposed
            const [ exposeMode, exposeDeeply, childGraph ] = this._calcExposition(
                propKey,
                propDef,
                options,
                context
            );
            
            // get proper source value
            let sourceValue = instance[propKey]; // initially pick instance default value as source
            if (
                exposeMode // property exposed to changes
                && source.hasOwnProperty(propKey) // property provided in source
            ) {
                sourceValue = source[propKey]; // override with provided source value
            }
            
            // get prop type
            const propType = propDef.type;
            
            // prepare child context
            const childContext : SerializationContext.ToClass = {
                ...context,
                transformers: propDef.transformers?.toClass,
                parent: source,
                propertyKey: propKey,
                path,
                graph: childGraph,
                forceExpose: context.forceExpose ?? exposeDeeply,
            };
            
            // start transformation
            if (!propType) {
                valueToSet = this._toClass(
                    sourceValue,
                    options,
                    {
                        ...childContext,
                        type: undefined
                    }
                );
            }
            else if (propType.type) {
                valueToSet = this._toClass(
                    sourceValue,
                    options,
                    {
                        ...childContext,
                        type: propType.type(),
                    }
                );
            }
            else if (propType.arrayOf) {
                valueToSet = [];
                
                for (const idx in sourceValue) {
                    const subValue = this._toClass(
                        sourceValue[idx],
                        options,
                        {
                            ...childContext,
                            type: propType.arrayOf(),
                            path: path + '.' + idx
                        }
                    );
                    if (![ undefined, null ].includes(subValue)) {
                        valueToSet[idx] = subValue;
                    }
                }
            }
            else if (propType.recordOf) {
                valueToSet = {};
                
                for (const prop2 in sourceValue) {
                    const subValue = this._toClass(
                        sourceValue[prop2],
                        options,
                        {
                            ...childContext,
                            type: propType.recordOf(),
                            path: path + '.' + prop2
                        }
                    );
                    if (subValue !== undefined) {
                        valueToSet[prop2] = subValue;
                    }
                }
            }
            
            instance[propKey] = valueToSet;
        }
        
        // transformation after
        {
            const [ finalValue ] = this._transform(
                instance,
                {
                    direction: Direction.ToClass,
                    type,
                    options,
                    context,
                },
                context.transformers?.after,
                typeDef?.transformers?.toClass?.after
            );
            
            return finalValue;
        }
    }
    
    public clone<T> (
        source : T,
        options : SerializationOptions.Base<T> = {}
    ) : T
    {
        const type : any = source?.constructor;
        if (!type) {
            return source;
        }
        
        const plain = this.toPlain(source, options);
        
        return this.toClass(plain, {
            type,
            ...options,
        });
    }
    
    
    
    protected _calcExposition<T> (
        propKey : PropertyKey,
        propDef : PropertyDefinition,
        options : SerializationOptions.Base<T>,
        context : SerializationContext.Base<T>
    ) : ExpositionCalcResult
    {
        // exlude prefixes is final
        if (options.excludePrefixes) {
            for (const prefix of options.excludePrefixes) {
                if (propKey.toString().startsWith(prefix)) {
                    return [ false, false ];
                }
            }
        }
        
        // forced expose is final
        if (context.forceExpose) {
            return [ true, true ];
        }
        
        // use graph
        if (options.strategy == Strategy.Graph) {
            return this._calcPropertyExpositionByGraph(
                context.graph,
                propKey,
            );
        }
        else {
            // assign by matched group
            if (propDef?.exposeDscrs) {
                for (const exposeDscr of propDef.exposeDscrs) {
                    const matched = this._matchExposeDscr(
                        exposeDscr,
                        context.groups
                    );
                    if (matched) {
                        return [ exposeDscr.mode, exposeDscr.deeply ];
                    }
                }
            }
        }
        
        // if no definition pick by default strategy
        const defaultStrategy = options.strategy == Strategy.Expose;
        return [ defaultStrategy, false ];
    }
    
    protected _calcPropertyExpositionByGraph (
        graph : ExposeGraph<any>,
        propKey : PropertyKey
    ) : ExpositionCalcResult
    {
        if (graph === true || graph === false) {
            return [ false, false, false ];
        }
        else if (graph === '*') {
            return [ true, false, true ];
        }
        else if (graph === '**') {
            return [ true, true, '**' ];
        }
        else {
            const expose = graph[propKey] ?? graph.$default ?? false;
            const deeply = expose === '**';
            return [ !!expose, deeply, expose ];
        }
    }
    
    protected _matchExposeDscr (
        exposeDscr : ExposeDscr,
        passedGroups : string[]
    ) : boolean
    {
        let result : boolean = true;
        
        if (
            exposeDscr.all
            || exposeDscr.any
        ) {
            result = false;
            
            if (
                exposeDscr.all
                && exposeDscr.all.every(group => passedGroups.includes(group))
            ) {
                result = true;
            }
            
            if (
                exposeDscr.any
                && exposeDscr.any.some(group => passedGroups.includes(group))
            ) {
                result = true;
            }
        }
        
        if (
            exposeDscr.notAny
            || exposeDscr.notAll
        ) {
            result = true;
            
            if (
                exposeDscr.notAny
                && exposeDscr.notAny.some(group => passedGroups.includes(group))
            ) {
                result = false;
            }
            
            if (
                exposeDscr.notAll
                && exposeDscr.notAll.every(group => passedGroups.includes(group))
            ) {
                result = false;
            }
        }
        
        return result;
    }
    
    protected _transform (
        source : any,
        params : TransformerFnParams,
        ...transformers : TransformerFn[]
    ) : [ any, boolean ]
    {
        let value = source;
        let final = false;
        
        for (const transformer of transformers) {
            if (transformer) {
                const result = transformer(source, params);
                
                value = result[0];
                final = result[1];
                
                if (final) {
                    break;
                }
            }
        }
        
        return [ value, final ];
    }
    
    protected _detectTypeFromPlain (
        source : any,
        context : SerializationContext.Base<any>
    ) : any
    {
        const providedTypeName = source instanceof Object
            ? source[this._typeProperty]
            : null
        ;
        
        let providedType : any;
        if (providedTypeName) {
            providedType = this._metadataStorage.getTypeByName(providedTypeName);
        }
        
        if (context.type) {
            if (providedType) {
                // verify is subclass
                const chainClasses = getClassesFromChain(providedType);
                if (chainClasses.includes(context.type)) {
                    return providedType;
                }
            }
            
            return context.type;
        }
        
        // return provided type
        if (providedType) {
            return providedType;
        }
        
        // return actual type
        if (source?.constructor) {
            return source.constructor;
        }
        
        return null;
    }
    
}
