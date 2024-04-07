import { isIterable, isTargetType } from '$/helpers/common.js';
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
import { Direction, Strategy, } from './def.js';
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
        const context : SerializationContext.ToPlain<T> = {
            depth: 0,
            path: '',
            groups: options.groups ?? [],
            graph: options.graph,
            circular: []
        };
        
        // prepare options
        options = {
            defaultStrategy: Strategy.Exclude,
            excludePrefixes: [],
            ...options,
        };
        
        // move type into context
        if (options.type) {
            context.type = options.type;
            delete options.type;
        }
        
        if (options.ctxData) {
            context.data = options.ctxData;
            delete options.ctxData;
        }
        
        delete options.groups;
        
        return this._toPlain(source, options, context);
    }
    
    protected _toPlain<T> (
        source : T,
        options : SerializationOptions.ToPlain<T>,
        context : SerializationContext.ToPlain<T>
    ) : any
    {
        // check depth limit
        if (
            options.depth !== undefined
            && context.depth > options.depth
        ) {
            return undefined;
        }
        
        // auto detect type
        if (!context.type) {
            if (source instanceof Array) {
                context.type = { arrayOf: () => undefined };
            }
        }
        
        // target type special cases
        if (context.type) {
            if (context.type.arrayOf) {
                if (!isIterable(source)) {
                    return [];
                }
                
                const array : any = [];
                for (const [ idx, itemRaw ] of Object.entries(source)) {
                    const path = (context.path ? context.path + '.' : '') + idx;
                    const item = this._toPlain<any>(itemRaw, options, {
                        ...context,
                        type: { type: context.type.arrayOf },
                        path,
                        depth: context.depth + 1,
                        circular: [ ...context.circular, source ],
                    });
                    
                    if (![ null, undefined ].includes(item)) {
                        array.push(item);
                    }
                }
                return array;
            }
            else if (context.type.recordOf) {
                if (!(source instanceof Object)) {
                    return undefined;
                }
                
                const record : any = {};
                for (const [ propKey, itemRaw ] of Object.entries(source)) {
                    const path = (context.path ? context.path + '.' : '') + propKey;
                    const item = this._toPlain<any>(itemRaw, options, {
                        ...context,
                        type: { type: context.type.recordOf },
                        path: path,
                        depth: context.depth + 1,
                        circular: [ ...context.circular, source ],
                    });
                    
                    if (![ undefined ].includes(item)) {
                        record[propKey] = item;
                    }
                }
                return record;
            }
        }
        
        // detect class type
        const sourceType = source?.constructor;
        const chainClasses = getClassesFromChain(sourceType);
        
        let type : any = null;
        if (context.type) {
            const targetType = context.type?.type();
            
            if (targetType) {
                // type restricted by context (parent)
                type = chainClasses.includes(targetType) // allow only classes from the same chain
                    ? sourceType
                    : targetType
                ;
            }
            else {
                type = sourceType;
            }
        }
        else {
            type = sourceType;
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
        if (context.graph === false) {
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
        
        // add type property
        if (typeDef) {
            if (typeDef.name) {
                plain[this._typeProperty] = typeDef.name;
            }
            if (typeDef.idProperty) {
                plain[typeDef.idProperty] = source[typeDef.idProperty];
            }
        }
        
        // process all properties
        const propDepth = context.depth + 1;
        if (
            options.depth === undefined
            || propDepth <= options.depth
        ) {
            // collect all suitable props
            const allProps = this._metadataStorage.getAllProperties(type);
            
            // add properties from source
            const excludeExtraneous = typeDef?.excludeExtraneous ?? true;
            if (!excludeExtraneous || context.forceExpose) {
                Object.keys(source)
                    .forEach(propKey => allProps.add(propKey))
                ;
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
                    typeDef,
                    propKey,
                    propDef,
                    options,
                    context
                );
                
                if (!exposeMode) {
                    // drop further processing for this prop
                    continue;
                }
                
                // prepare child context
                const childContext : SerializationContext.ToPlain = {
                    ...context,
                    transformers: propDef.transformers?.toPlain,
                    parent: source,
                    propertyKey: propKey,
                    path,
                    depth: propDepth,
                    circular: [ ...context.circular, source ],
                    graph: childGraph,
                    forceExpose: context.forceExpose ?? exposeDeeply,
                };
                
                // serializer inner
                const valueToSet = this._toPlain(
                    source[propKey],
                    options,
                    {
                        ...childContext,
                        type: propDef.type,
                    }
                );
                
                if (valueToSet !== undefined) {
                    plain[propKey] = valueToSet;
                }
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
        options : SerializationOptions.ToClass<T>,
    ) : T
    {
        const context : SerializationContext.ToClass<T> = {
            path: '',
            groups: options.groups ?? [],
            graph: options.graph,
        };
        
        // prepare options
        options = {
            defaultStrategy: Strategy.Exclude,
            excludePrefixes: [],
            ...options,
        };
        
        // move type into context
        if (options.type) {
            if (typeof options.type == 'string') {
                const type = this._metadataStorage.getTypeByName(options.type);
                if (!type) {
                    throw new Exception(
                        'Unknown type name: ' + options.type,
                        1710478811512
                    );
                }
                
                context.type = { type: () => type };
            }
            else if (isTargetType(options.type)) {
                context.type = options.type;
            }
            else {
                const type = options.type;
                context.type = { type: () => type };
            }
            
            delete options.type;
        }
        
        // move ctxData into context
        if (options.ctxData) {
            context.data = options.ctxData;
            delete options.ctxData;
        }
        
        delete options.groups;
        
        return this._toClass(source, options, context);
    }
    
    protected _toClass<T> (
        source : any,
        options : SerializationOptions.ToClass<T>,
        context : SerializationContext.ToClass<T>
    ) : T
    {
        // catch graph serialization
        if (context.graph === false) {
            return undefined;
        }
        
        // auto detect type
        if (!context.type) {
            if (source instanceof Array) {
                context.type = { arrayOf: () => undefined };
            }
        }
        
        // target type special cases
        if (context.type) {
            if (context.type.arrayOf) {
                if (!isIterable(source)) {
                    return <any>[];
                }
                
                const array : any = [];
                for (const [ idx, itemRaw ] of Object.entries(source)) {
                    const path = (context.path ? context.path + '.' : '') + idx;
                    const item = this._toClass<any>(itemRaw, options, {
                        ...context,
                        type: { type: context.type.arrayOf },
                        path: path,
                    });
                    
                    if (![ null, undefined ].includes(item)) {
                        array.push(item);
                    }
                }
                return array;
            }
            else if (context.type.recordOf) {
                if (!(source instanceof Object)) {
                    return undefined;
                }
                
                const record : any = {};
                for (const [ propKey, itemRaw ] of Object.entries(source)) {
                    const path = (context.path ? context.path + '.' : '') + propKey;
                    const item = this._toClass<any>(itemRaw, options, {
                        ...context,
                        type: { type: context.type.recordOf },
                        path: path,
                    });
                    
                    if (![ undefined ].includes(item)) {
                        record[propKey] = item;
                    }
                }
                return record;
            }
        }
        
        // detect class type
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
        const instance = (!type || source instanceof type)
            ? source // use provided instance
            : new type() // new instance of type
        ;
        
        const allProps = this._metadataStorage.getAllProperties(type);
        
        // add properties from source
        const excludeExtraneous = typeDef?.excludeExtraneous ?? true;
        if (!excludeExtraneous || context.forceExpose) {
            Object.keys(source)
                .filter(propKey => ![ this._typeProperty ].includes(propKey)) // skip special props
                .forEach(propKey => allProps.add(propKey))
            ;
        }
        
        for (const propKey of allProps) {
            const path = (context.path ? context.path + '.' : '') + propKey.toString();
            
            const propDef : PropertyDefinition = this._metadataStorage
                .getPropertyDefinition(type, propKey);
            
            // detect non-writable prop
            const dscr = propDef?.descriptor;
            if (dscr) {
                if (dscr.get && !dscr.set) {
                    // skip
                    continue;
                }
            }
            
            // check should property be exposed
            const [ exposeMode, exposeDeeply, childGraph ] = this._calcExposition(
                typeDef,
                propKey,
                propDef,
                options,
                context
            );
            
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
            
            // get proper source value
            let sourceValue = instance[propKey]; // initially pick instance default value as source
            if (
                exposeMode // property exposed to changes
                && source.hasOwnProperty(propKey) // property provided in source
            ) {
                sourceValue = source[propKey]; // override with provided source value
            }
            
            // deserializer inner
            instance[propKey] = this._toClass(
                sourceValue,
                options,
                {
                    ...childContext,
                    type: propDef.type,
                }
            );
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
        
        const plain = this.toPlain(source, {
            defaultStrategy: Strategy.Expose,
            ...options
        });
        
        return this.toClass(plain, {
            type,
            defaultStrategy: Strategy.Expose,
            ...options,
        });
    }
    
    
    
    protected _calcExposition<T> (
        typeDef : TypeDefinition,
        propKey : PropertyKey,
        propDef : PropertyDefinition,
        options : SerializationOptions.Base<T>,
        context : SerializationContext.Base<T>
    ) : ExpositionCalcResult
    {
        // exclude prefixes is final
        const excludePrefixes = [
            ...options.excludePrefixes,
            ...(typeDef?.excludePrefixes ?? [])
        ];
        
        for (const prefix of excludePrefixes) {
            if (propKey.toString().startsWith(prefix)) {
                return [ false, false ];
            }
        }
        
        // forced expose is final
        if (context.forceExpose) {
            return [ true, true ];
        }
        
        const strategy = typeDef?.defaultStrategy ?? options.defaultStrategy;
        const exposeByDefault = strategy == Strategy.Expose;
        
        if (context.graph !== undefined) {
            // use graph
            return this._calcPropertyExpositionByGraph(
                context.graph,
                propKey,
                exposeByDefault
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
        return [ exposeByDefault, false ];
    }
    
    protected _calcPropertyExpositionByGraph (
        graph : ExposeGraph<any>,
        propKey : PropertyKey,
        exposeByDefault : boolean
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
            const expose = graph[propKey] ?? graph.$default ?? exposeByDefault;
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
            const type = context.type.type?.();
            if (type) {
                if (providedType) {
                    // verify is subclass
                    const chainClasses = getClassesFromChain(providedType);
                    if (chainClasses.includes(type)) {
                        return providedType;
                    }
                }
                
                return type;
            }
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
