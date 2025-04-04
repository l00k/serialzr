import type { ClassConstructor, SerializationContext, SerializationOptions, TransformationResult } from '$/def.js';
import { BaseTransformer } from '$/transformers/BaseTransformer.js';

export class BuiltInTypeTransformer extends BaseTransformer
{
    
    public shouldApply (
        source : any,
        type : ClassConstructor<any>,
        options : SerializationOptions.Base<any>,
        context : SerializationContext.Base<any>,
    ) : boolean
    {
        return [
            Boolean,
            Number,
            String,
        ].includes(<any>type);
    }
    
    public serialize (
        source : any,
        type : ClassConstructor<any>,
    ) : TransformationResult
    {
        const output : any = this._transformBuiltIn(source, type);
        return { output, final: true };
    }
    
    public deserialize (
        source : any,
        type : ClassConstructor<any>,
    ) : TransformationResult
    {
        const output : any = this._transformBuiltIn(source, type);
        return { output, final: true };
    }
    
    protected _transformBuiltIn (
        source : any,
        type : ClassConstructor<any>,
    ) : any
    {
        if (type == Boolean) {
            if (typeof source == 'boolean') {
                return source;
            }
            else if (typeof source == 'string') {
                return source == 'true';
            }
            return !!source;
        }
        else if (type == Number) {
            if (typeof source == 'number') {
                return source;
            }
            return Number(source);
        }
        else if (type == String) {
            if (typeof source == 'string') {
                return source;
            }
            return String(source);
        }
        
        return undefined;
    }
    
}
