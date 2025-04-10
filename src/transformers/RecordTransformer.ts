import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';


export class RecordTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -700;
    public readonly deserializeOrder : number = -700;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return !!context.typeDscr?.recordOf;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        if (!(input instanceof Object)) {
            context.stopProcessing = true;
            return undefined;
        }
        
        const newTypeDscr = { type: context.typeDscr.recordOf };
        const newCircular = [ ...context.circular, input ];
        
        const output : any = {};
        for (const [ propKey, itemRaw ] of Object.entries(input)) {
            context.fork(() => {
                context.parent = input;
                context.propertyKey = undefined;
                context.path = (context.path ? context.path + '.' : '') + propKey;
                context.typeDscr = newTypeDscr;
                context.circular = newCircular;
                
                const item = this._serializer._serializeInternal(
                    itemRaw,
                    context,
                );
                
                if (item !== undefined) {
                    output[propKey] = item;
                }
            });
        }
        
        context.stopProcessing = true;
        
        return output;
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        if (!(input instanceof Object)) {
            context.stopProcessing = true;
            return undefined;
        }
        
        const newTypeDscr = { type: context.typeDscr.recordOf };
        
        const record : any = {};
        for (const [ propKey, itemRaw ] of Object.entries(input)) {
            context.fork(() => {
                context.parent = input;
                context.propertyKey = undefined;
                context.path = (context.path ? context.path + '.' : '') + propKey;
                context.typeDscr = newTypeDscr;
                
                const item = this._serializer._deserializeInternal(
                    itemRaw,
                    context,
                );
                
                if (item !== undefined) {
                    record[propKey] = item;
                }
            });
        }
        
        context.stopProcessing = true;
        
        return record;
    }
    
}
