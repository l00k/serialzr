import type { Context } from './Context.js';

export type RecursivePartial<T> = T extends object
    ? { [K in keyof T]? : RecursivePartial<T[K]> }
    : T extends (infer U)[]
        ? RecursivePartial<U>[]
        : T
    ;

export interface ClassConstructor<T = any>
{
    new (...args : any[]) : T;
}

export type TypedClassDecorator<T> = (target : ClassConstructor<T>) => void;

export type TypeFn = () => any;

export type TypeDscr = {
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
    type : ClassConstructor,
    id : IdType,
};

// transformers
export type TransformerOptions = void;

export type PropTransformerResult<R> = {
    output : R,
    final : boolean,
}

export type PropTransformerFnParams<T = any> = {
    direction : Direction,
    context? : Context<T>,
}

export type PropTransformerFn<S = any, R = any> = (
    source : S,
    params : PropTransformerFnParams<S>,
) => PropTransformerResult<R>;

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
    params : PropTransformerFnParams,
};

export type ComputedGetterFn = (arg : ComputedGetterFnArg) => any;


// exposing properties
export type ExposeRule = {
    // modifiers
    expose? : boolean, // true - expose, false - exclude
    forceExpose? : boolean, // force expose deeply
    
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
    ctxData : any,
    context : Context<T>,
) => boolean;

export type AutoGroupEntry = {
    groups : string[],
    fn : AutoGroupFn,
};


// expose graph
export type ExposeGraphFlag = true // expose
    | false // exclude
    | number // expose all properties on N levels
    | '*' // expose 1 level
    | '**' // expose all properties deeply
    ;

export type ExposeGraphModificators = {
    $expose? : ExposeGraphFlag,
    $forceExpose? : boolean,
    $ctxMod? : RecursivePartial<Context>,
};

export type ExposeGraphNode = ExposeGraphFlag
    | ExposeGraphModificators
    ;

export type ExposeGraphProperty = {
    $default? : ExposeGraphNode,
};

type _ExposeGraph<T> = T extends object
    ? ExposeGraphProperty & { [K in keyof T]? : ExposeGraph<T[K]> }
    : never
    ;

type _ExposeGraph2<T> = T extends (infer U)[]
    ? _ExposeGraph<U>
    : T extends Record<any, (infer V)>
        ? _ExposeGraph<V>
        : _ExposeGraph<T>
    ;

export type ExposeGraph<T = any> = ExposeGraphNode | _ExposeGraph2<T>;


// modifiers
export type TypeModifiers = {
    excludePrefixes? : string[],
    excludeExtraneous? : boolean,
    defaultStrategy? : boolean,
    keepInitialValues? : boolean,
};

export type PropertyModifiers = {
    forceRaw? : boolean,
    objectMerge? : boolean,
    arrayAppend? : boolean,
    
    [custom : string] : any,
};


// definitions
export type TypeDefinition<T = any> = {
    name? : string,
    idProperty? : PropertyKey | keyof T,
    autoGroups? : AutoGroupEntry[],
    modifiers? : TypeModifiers,
}

export type PropertyDefinition = {
    descriptor? : PropertyDescriptor,
    exposeRules? : ExposeRule[],
    typeDscr? : TypeDscr,
    transformers? : PropTransformerDscr,
    modifiers? : PropertyModifiers,
}


// serialization options
export namespace SerializationOptions
{
    export type Base<T = any> = TypeModifiers & {
        typeProperty? : string,
        objectLinkProperty? : string,
        useObjectLink? : boolean,
        
        groups? : string[],
        graph? : ExposeGraph<T>,
        ctxData? : Record<any, any>,
        
        typeDscr? : TypeDscr,
        maxDepth? : number,
    }
    
    export type Deserialize<T = any> = Base<T> & {
        type? : ClassConstructor<T> | string,
        typeDscr? : TypeDscr,
    };
    export type Serialize<T = any> = Omit<Base<T>, 'keepInitialValues'> & {
        depth? : number,
        typeDscr? : Omit<TypeDscr, 'type'>,
    };
}
