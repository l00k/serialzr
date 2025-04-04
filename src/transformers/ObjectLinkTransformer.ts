import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { buildObjectLink, parseObjectLink } from '$/helpers/index.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';

export class ObjectLinkTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        // this transformer should be called last
        // at this stage non object values should not be passed further
        return !(source instanceof Object)
            && options.useObjectLink
            && !!context.typeDef
            ;
    }
    
    public serialize (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        { typeDef } : SerializationContext.Base<any>,
    ) : TransformationResult
    {
        const output : any = buildObjectLink(
            { [typeDef.idProperty]: source },
            typeDef,
        );
        
        return { output, final: true };
    }
    
    public deserialize (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        { typeDef } : SerializationContext.Base<any>,
    ) : TransformationResult
    {
        // at this stage non object types are considered as object link
        // may throw if object link is not valid
        const parsedObjectLink = parseObjectLink(source);
        
        const object = new parsedObjectLink.type();
        object[typeDef.idProperty] = parsedObjectLink.id;
        
        return { output: object, final: true };
    }
    
}
