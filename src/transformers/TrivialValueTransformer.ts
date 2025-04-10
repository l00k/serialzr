import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';

export class TrivialValueTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -300;
    public readonly deserializeOrder : number = -300;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return [ null, undefined ].includes(input);
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        return input;
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        return input;
    }
    
}
