import { RegisterTransformer } from '$/decorators/index.js';
import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';


@RegisterTransformer({
    serializeOrder: -100,
    deserializeOrder: -100,
})
export class BigIntTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        return <any>type === BigInt;
    }
    
    public serialize (source : any) : TransformationResult
    {
        const output = source.constructor == BigInt
            ? source.toString(10)
            : undefined
        ;
        
        return { output, final: true };
    }
    
    public deserialize (source : any) : TransformationResult
    {
        const output = [ 'string', 'number' ].includes(typeof source)
            ? BigInt(source)
            : undefined
        ;
        
        return { output, final: true };
    }
    
}
