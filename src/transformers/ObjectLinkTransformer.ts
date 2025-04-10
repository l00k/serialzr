import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';

export class ObjectLinkTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -100;
    public readonly deserializeOrder : number = -100;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        // this transformer should be called last
        // at this stage non object values should not be passed further
        return !(input instanceof Object)
            && context.options.useObjectLink
            && !!context.typeDef
            ;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        return this._objectLinkProcessor.build(
            { [context.typeDef.idProperty]: input },
            true,
            context.typeDef,
        );
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        // at this stage non object types are considered as object link
        // may throw if object link is not valid
        const parsedObjectLink = this._objectLinkProcessor.parse(input);
        
        const object = new parsedObjectLink.type();
        object[context.typeDef.idProperty] = parsedObjectLink.id;
        
        return object;
    }
    
}
