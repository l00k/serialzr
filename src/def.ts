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
    ToPlain = 'ToPlain',
    ToClass = 'ToClass',
}

export enum Strategy
{
    Expose = 'expose',
    Exclude = 'exclude',
    Graph = 'graph',
}


// transformers
export type TransformerFnParams<T = any> = {
    direction : Direction,
    type : any,
    options? : SerializationOptions.Base<T> | any,
    context? : SerializationContext.Base<T> | any,
}

export type TransformationResult<R> = [ R, boolean? ];

export type TransformerFn<S = any, R = any> = (source : S, params : TransformerFnParams<S>) => TransformationResult<R>;

export type TransformerDscr<S = any, R = any> = {
    before? : TransformerFn<S, R>,
    after? : TransformerFn<S, R>,
};

export type Transformers<T = any> = {
    toClass? : TransformerDscr<any, T>,
    toPlain? : TransformerDscr<T, any>,
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

type _ExposeGraph<T> = T extends Object
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


// definitions
export type TypeDefinition = {
    name? : string,
    idProperty? : PropertyKey,
    autoGroups? : AutoGroupEntry[],
    transformers? : Transformers,
}

export type PropertyDefinition = {
    descriptor? : PropertyDescriptor,
    exposeDscrs? : ExposeDscr[],
    type? : TargetType,
    transformers? : Transformers,
}


// transform options
export namespace SerializationOptions
{
    export type Base<T> = {
        strategy? : Strategy,
        groups? : string[],
        graph? : ExposeGraph<T>,
        excludePrefixes? : string[],
        ctxData? : Record<any, any>,
    }
    
    export type ToClass<T = any> = Base<T> & {
        type? : TargetType | ClassConstructor<T> | string,
    };
    export type ToPlain<T = any> = Base<T> & {
        depth? : number,
    };
}


// transform context
export namespace SerializationContext
{
    export type Base<T> = {
        type? : TargetType,
        transformers? : TransformerDscr,
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
