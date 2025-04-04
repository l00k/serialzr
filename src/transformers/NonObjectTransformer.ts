import type { TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';

export class NonObjectTransformer extends BaseTransformer
{
    
    public shouldApply (source : any) : boolean
    {
        // this transformer should be called last
        // at this stage non object values should not be passed further
        return !(source instanceof Object);
    }
    
    public serialize () : TransformationResult
    {
        return { output: undefined, final: true };
    }
    
    public deserialize () : TransformationResult
    {
        return { output: undefined, final: true };
    }
    
}
