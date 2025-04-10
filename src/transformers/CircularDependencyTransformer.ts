import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';

export class CircularDependencyTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -600;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return context.circular.includes(input);
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        if (context.typeDef) {
            if (context.options.useObjectLink) {
                return this._objectLinkProcessor.build(
                    input,
                    true,
                    context.typeDef,
                );
            }
            
            const plain : any = {};
            
            if (context.typeDef.name) {
                plain[context.options.typeProperty] = context.typeDef.name;
            }
            if (context.typeDef.idProperty) {
                plain[context.typeDef.idProperty] = input[context.typeDef.idProperty];
            }
            
            return plain;
        }
        else {
            return undefined;
        }
    }
    
}
