export interface ClassConstructor<T>
{
    new (...args : any[]) : T;
}

export type TypedClassDecorator<T> = (target : ClassConstructor<T>) => void;

export type TypeFn = () => any;
export type TargetType = {
    type? : TypeFn,
    arrayOf? : TypeFn,
    recordOf? : TypeFn,
};

export type FactoryFn<T> = () => ClassConstructor<T> & {
    create : (id : any, data : any) => T,
};

export enum Direction
{
    Serialize = 'serialize',
    Deserialize = 'deserialize',
}

export enum Strategy
{
    Expose = 'expose',
    Exclude = 'exclude',
}

export type IdType = number | string;

export type ParsedObjectLink = {
    type : ClassConstructor<any>,
    id : IdType,
};


// transformers
export enum TransformStage
{
    Before = 'before',
    After = 'after',
}

export type TransformationResult<T = any> = {
    output : T,
    final : boolean,
}

export type TransformerOptions = {
    serializeOrder? : number,
    deserializeOrder? : number,
}

export type TransformerFnParams<T = any> = {
    direction : Direction,
    type : any,
    options? : SerializationOptions.Base<T> | any,
    context? : SerializationContext.Base<T> | any,
}

export type PropTransformerFn<S = any, R = any> = (source : S, params : TransformerFnParams<S>) => TransformationResult<R>;

export type PropTransformerGroup<S = any, R = any> = {
    before? : PropTransformerFn<S, R>,
    after? : PropTransformerFn<S, R>,
};

export type PropTransformerDscr<T = any> = {
    serialize? : PropTransformerGroup<T, any>,
    deserialize? : PropTransformerGroup<any, T>,
};


// computed
export type ComputedGetterFnArg = {
    value : any,
    parent : any,
    params : TransformerFnParams,
};

export type ComputedGetterFn = (arg : ComputedGetterFnArg) => any;


// exposing properties
export type ExposeMode = boolean | 'id';

export type ExposeDscr = {
    // modifiers
    mode? : boolean, // true - expose, false - exclude
    deeply? : boolean, // expose deeply
    
    // conditions
    all? : string[], // matched if all groups are present
    any? : string[], // matched if any group is present
    notAll? : string[], // matched if no all groups are present
    notAny? : string[], // matched if none of groups is present
};

export type ExposeOptions = {
    direction? : Direction,
    groups? : string[],
    deeply? : boolean
}

// auto groups
export type AutoGroupFn<T = any> = (
    object : T | any,
    ctx : any,
    context : SerializationContext.Base<T>
) => boolean;

export type AutoGroupEntry = {
    groups : string[],
    fn : AutoGroupFn,
};


// expose graph
export type ExposeGraphFlag = true | false | '*' | '**';

type _ExposeGraph<T> = T extends object
    ? { $default? : ExposeGraphFlag } & { [K in keyof T]? : ExposeGraph<T[K]> }
    : never
    ;

type _ExposeGraph2<T> = T extends (infer U)[]
    ? _ExposeGraph<U>
    : T extends Record<any, (infer V)>
        ? _ExposeGraph<V>
        : _ExposeGraph<T>
    ;

export type ExposeGraph<T> = ExposeGraphFlag | _ExposeGraph2<T>;


// modifiers
export type TypeModifiers = {
    excludePrefixes? : string[],
    excludeExtraneous? : boolean,
    defaultStrategy? : Strategy,
    keepInitialValues? : boolean,
};

export type PropertyModifiers = {
    forceRaw? : boolean,
    objectMerge? : boolean,
    arrayAppend? : boolean,
};


// definitions
export type TypeDefinition = {
    name? : string,
    idProperty? : PropertyKey,
    autoGroups? : AutoGroupEntry[],
    modifiers? : TypeModifiers,
}

export type PropertyDefinition = {
    descriptor? : PropertyDescriptor,
    exposeDscrs? : ExposeDscr[],
    type? : TargetType,
    transformers? : PropTransformerDscr,
    modifiers? : PropertyModifiers,
}


// serialization options
export namespace SerializationOptions
{
    export type Base<T> = TypeModifiers & {
        typeProperty? : string,
        idProperty? : string,
        useObjectLink? : boolean,
        
        groups? : string[],
        graph? : ExposeGraph<T>,
        ctxData? : Record<any, any>,
    }
    
    export type ToClass<T = any> = Base<T> & {
        type? : TargetType | ClassConstructor<T> | string,
    };
    export type ToPlain<T = any> = Omit<Base<T>, 'keepInitialValues'> & {
        depth? : number,
        type? : Omit<TargetType, 'type'>,
    };
}


// serialization context
export namespace SerializationContext
{
    export type Base<T> = {
        type? : TargetType,
        typeDef? : TypeDefinition,
        propTransformer? : PropTransformerGroup,
        propModifiers? : PropertyModifiers,
        forceExpose? : boolean,
        groups? : string[],
        parent? : any,
        propertyKey? : PropertyKey,
        path? : string,
        graph? : ExposeGraph<T>,
        data? : Record<any, any>,
    }
    
    export type ToClass<T = any> = Base<T> & {};
    export type ToPlain<T = any> = Base<T> & {
        depth? : number,
        circular? : any[],
    };
}
