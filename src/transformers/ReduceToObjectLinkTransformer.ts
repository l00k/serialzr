import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';


export class ReduceToObjectLinkTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        { typeDef } : SerializationContext.Base<any>,
    ) : boolean
    {
        if (
            !options.useObjectLink
            || !(source instanceof Object)
            || !typeDef?.idProperty
            || !source[typeDef.idProperty]
        ) {
            return false;
        }
        
        const allowedProps = [
            options.typeProperty,
            options.objectLinkProperty,
            typeDef.idProperty,
        ];
        
        const props = Object.keys(source);
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
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : TransformationResult
    {
        return {
            output: source[options.objectLinkProperty],
            final: true,
        };
    }
    
}
