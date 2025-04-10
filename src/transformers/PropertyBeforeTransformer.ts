import type { Context } from '$/Context.js';
import { Direction } from '$/def.js';
import { BaseTransformer } from './BaseTransformer.js';

export class PropertyBeforeTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -400;
    public readonly deserializeOrder : number = -400;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return !!(
            context.propDef?.transformers?.serialize?.before
            ?? context.propDef?.transformers?.deserialize?.before
        );
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        const transformer = context.propDef.transformers.serialize?.before;
        
        const result = transformer(
            input,
            {
                direction: Direction.Serialize,
                context,
            },
        );
        
        if (result.final) {
            context.stopProcessing = true;
        }
        
        return result.output;
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        const transformer = context.propDef.transformers.deserialize?.before;
        
        const result = transformer(
            input,
            {
                direction: Direction.Deserialize,
                context,
            },
        );
        
        if (result.final) {
            context.stopProcessing = true;
        }
        
        return result.output;
    }
    
}
