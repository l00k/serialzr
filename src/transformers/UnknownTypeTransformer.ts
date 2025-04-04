import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';

export class UnknownTypeTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        return [
            null,
            undefined,
        ].includes(<any>type);
    }
    
    public serialize (
        source : any,
        type : ClassConstructor<any>,
    ) : TransformationResult
    {
        return { output: source, final: true };
    }
    
    public deserialize (
        source : any,
        type : ClassConstructor<any>,
    ) : TransformationResult
    {
        return { output: source, final: true };
    }
    
}
