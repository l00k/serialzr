import { RegisterTransformer } from '$/decorators/index.js';
import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';


@RegisterTransformer({
    serializeOrder: -100,
    deserializeOrder: -100,
})
export class DateTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        return type === Date;
    }
    
    public serialize (source : any) : TransformationResult
    {
        const output = source instanceof Date
            ? source.toISOString()
            : undefined
        ;
        
        return { output, final: true };
    }
    
    public deserialize (source : any) : TransformationResult
    {
        const output = [ 'string', 'number' ].includes(typeof source)
            ? new Date(source)
            : undefined
        ;
        
        return { output, final: true };
    }
    
}
