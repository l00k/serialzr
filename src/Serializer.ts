import { isIterable, isTargetType } from '$/helpers/common.js';
import type {
    ClassConstructor,
    ExposeDscr,
    ExposeGraph,
    ExposeMode,
    ParsedObjectLink,
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
    objectLinkProperty? : string,
    useObjectLink? : boolean,
}

type ExpositionCalcResult = [ ExposeMode, boolean, ExposeGraph<any>? ];


export class Serializer
{
    
    protected _metadataStorage : MetadataStorage = MetadataStorage.getSingleton();
    
    protected _typeProperty : string = '@type';
    protected _objectLinkProperty : string = '@id';
    
    protected _useObjectLink : boolean = false;
    protected _initiated : boolean = false;
    
    
    public init (options : Options = {})
    {
        if (this._initiated) {
            throw new Exception(
                'Serializer already initiated',
                1709577709189
            );
        }
        
        if ('typeProperty' in options) {
            this._typeProperty = options.typeProperty;
        }
        
        if ('objectLinkProperty' in options) {
            this._objectLinkProperty = options.objectLinkProperty;
        }
        
        if ('useObjectLink' in options) {
            this._useObjectLink = options.useObjectLink;
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
    
    
    public buildObjectLink (
        source : any,
        type? : ClassConstructor<any>,
    ) : string
    {
        if (!type) {
            type = source.constructor;
        }
        
        const typeDef = this._metadataStorage.getTypeDefinition(type);
        if (!typeDef) {
            throw new Exception(
                'Unknown type: ' + type.name,
                1743359920074
            );
        }
        
        return this._buildObjectLink(
            source,
            typeDef,
            false,
        );
    }
    
    public parseObjectLink (objectLink : string) : ParsedObjectLink
    {
        if (!objectLink.startsWith('@/')) {
            throw new Exception(
                'Wrong format of object link',
                1743360099255
            );
        }
        
        objectLink = objectLink.substring(2);
        
        const lastSlashIdx = objectLink.lastIndexOf('/');
        const typeName = objectLink.substring(0, lastSlashIdx);
        const idRaw = objectLink.substring(lastSlashIdx + 1);
        
        const type = this.getTypeByName(typeName);
        if (!type) {
            throw new Exception(
                'Unknown type: ' + type.name,
                1743360231473
            );
        }
        
        const typeDef = this._metadataStorage.getTypeDefinition(type);
        if (!typeDef) {
            throw new Exception(
                'Unknown type: ' + type.name,
                1743360244832
            );
        }
        
        const idPropName = typeDef.idProperty;
        if (!idPropName) {
            throw new Exception(
                'There is no defined property for type: ' + type.name,
                1743360388303
            );
        }
        
        const idPropTypeDef = this._metadataStorage.getPropertyDefinition(type, idPropName);
        const idPropType = idPropTypeDef.type?.type
            ? idPropTypeDef.type?.type()
            : String
        ;
        
        const id = idPropType == Number
            ? Number(idRaw)
            : idRaw
        ;
        
        return {
            type,
            id,
        };
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
            excludeExtraneous: true,
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
        if ([ undefined, null ].includes(<any>source)) {
            return <any>source;
        }
        
        // built in types
        if ([ undefined, null ].includes(type)) {
            return <any>source;
        }
        if ([ Boolean, Number, String, Date, BigInt ].includes(type)) {
            return this._transformBuiltIn(type, source);
        }
        
        // verify source type
        if (!(source instanceof Object)) {
            if (typeDef) {
                // at this stage non object types are considered as ID value
                return this._buildObjectLink(
                    { [typeDef.idProperty]: source },
                    typeDef,
                );
            }
            else {
                // no info how to transform entry
                // transformer may be required to handle this case
                return undefined;
            }
        }
        
        // build plain object
        const plain : any = {};
        
        // add type property
        if (typeDef) {
            if (typeDef.name) {
                plain[this._typeProperty] = typeDef.name;
            }
            if (this._useObjectLink) {
                plain[this._objectLinkProperty] = this._buildObjectLink(
                    source,
                    typeDef,
                );
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
            const excludeExtraneous = typeDef?.modifiers.excludeExtraneous ?? options.excludeExtraneous;
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
                
                // serializer inner
                let valueToSet : any;
                if (propDef.modifiers.forceRaw) {
                    valueToSet = source[propKey];
                }
                else {
                    // prepare child context
                    const childContext : SerializationContext.ToPlain = {
                        ...context,
                        type: propDef.type,
                        transformers: propDef.transformers?.toPlain,
                        parent: source,
                        propertyKey: propKey,
                        path,
                        depth: propDepth,
                        circular: [ ...context.circular, source ],
                        graph: childGraph,
                        forceExpose: context.forceExpose ?? exposeDeeply,
                    };
                    
                    valueToSet = this._toPlain(
                        source[propKey],
                        options,
                        childContext
                    );
                }
                
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
        if (this._useObjectLink) {
            return this._buildObjectLink(source, typeDef);
        }
        
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
            excludeExtraneous: true,
            keepInitialValues: true,
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
        if ([ undefined, null ].includes(type)) {
            return <any>source;
        }
        if ([ Boolean, Number, String, Date, BigInt ].includes(type)) {
            return this._transformBuiltIn(type, source);
        }
        
        // verify source type
        if (!(source instanceof Object)) {
            if (
                typeDef
                && this._useObjectLink
            ) {
                // at this stage non object types are considered as object link
                try {
                    const parsedObjectLink = this.parseObjectLink(source);
                
                    const object = new parsedObjectLink.type();
                    object[typeDef.idProperty] = parsedObjectLink.id;
                    
                    return object;
                }
                catch (e) {
                    // unable to parse object link
                    return undefined;
                }
            }
            else {
                // no info how to transform entry
                // transformer may be required to handle this case
                return undefined;
            }
        }
        
        // create target instance
        let instance = null;
        
        if (!type || source instanceof type) {
            // use provided instance
            instance = source;
        }
        else {
            // new instance of type
            const keepInitialValues = typeDef?.modifiers.keepInitialValues ?? options.keepInitialValues;
            if (keepInitialValues) {
                instance = new type();
            }
            else {
                instance = Object.create(type.prototype);
            }
        }
        
        const allProps = this._metadataStorage.getAllProperties(type);
        
        // add properties from source
        const excludeExtraneous = typeDef?.modifiers.excludeExtraneous ?? options.excludeExtraneous;
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
            
            // get proper source value
            if (
                exposeMode // property exposed to changes
                && Object.hasOwn(source, propKey) // property provided in source
            ) {
                // deserializer inner
                let targetValue : any;
                if (propDef.modifiers.forceRaw) {
                    targetValue = source[propKey];
                }
                else {
                    // prepare child context
                    const childContext : SerializationContext.ToClass = {
                        ...context,
                        type: propDef.type,
                        transformers: propDef.transformers?.toClass,
                        parent: source,
                        propertyKey: propKey,
                        path,
                        graph: childGraph,
                        forceExpose: context.forceExpose ?? exposeDeeply,
                    };
                    
                    targetValue = this._toClass(
                        source[propKey],
                        options,
                        childContext
                    );
                }
                
                if (
                    propDef.modifiers.objectMerge
                    && instance[propKey] instanceof Object
                ) {
                    Object.assign(instance[propKey], targetValue);
                }
                else if (
                    propDef.modifiers.arrayAppend
                    && Array.isArray(instance[propKey])
                ) {
                    instance[propKey].push(...targetValue);
                }
                else {
                    instance[propKey] = targetValue;
                }
            }
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
            ...(typeDef?.modifiers.excludePrefixes ?? [])
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
        
        const strategy = typeDef?.modifiers.defaultStrategy ?? options.defaultStrategy;
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
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
    
    protected _buildObjectLink (
        source : any,
        typeDef : TypeDefinition,
        allowBlank : boolean = true,
    ) : string
    {
        const id = source[typeDef.idProperty];
        if (id === undefined) {
            if (allowBlank) {
                return undefined;
            }
            else {
                throw new Exception(
                    'Id value not specified',
                    1743360679287
                );
            }
        }
    
        return '@/' + typeDef.name + '/' + id;
    }
    
    protected _transformBuiltIn (
        type : ClassConstructor<any>,
        source : any,
    ) : any
    {
        if (type == Boolean) {
            if (typeof source == 'boolean') {
                return source;
            }
            else if (typeof source == 'string') {
                return source == 'true';
            }
            return !!source;
        }
        else if (type == Number) {
            if (typeof source == 'number') {
                return source;
            }
            return Number(source);
        }
        else if (type == String) {
            if (typeof source == 'string') {
                return source;
            }
            return String(source);
        }
        else if (type == Date) {
            return new Date(source);
        }
        else if (type == <any>BigInt) {
            return BigInt(source);
        }
        
        return undefined;
    }
    
}
