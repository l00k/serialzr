import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';


export abstract class BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        return false;
    }
    
    public abstract serialize (
        source : any,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : TransformationResult;
    
    public abstract deserialize (
        source : any,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : TransformationResult;
    
}
