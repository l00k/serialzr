import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';


export class ReduceToObjectLinkTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = 100;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        if (
            !context.options.useObjectLink
            || !(input instanceof Object)
            || !context.typeDef?.idProperty
            || !input[context.typeDef.idProperty]
        ) {
            return false;
        }
        
        const allowedProps = [
            context.options.typeProperty,
            context.options.objectLinkProperty,
            context.typeDef.idProperty,
        ];
        
        const props = Object.keys(input);
        if (props.length !== allowedProps.length) {
            return false;
        }
        
        for (const prop of props) {
            if (!allowedProps.includes(prop)) {
                return false;
            }
        }
        
        return true;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        return input[context.options.objectLinkProperty];
    }
    
}
