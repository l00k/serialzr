import type { Context } from '$/Context.js';
import { isIterable } from '$/helpers/index.js';
import { BaseTransformer } from './BaseTransformer.js';


export class ArrayTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -700;
    public readonly deserializeOrder : number = -700;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return !!context.typeDscr?.arrayOf;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        if (!isIterable(input)) {
            context.stopProcessing = true;
            return undefined;
        }
        
        const newTypeDscr = { type: context.typeDscr.arrayOf };
        const newCircular = [ ...context.circular, input ];
        
        const output : any = [];
        for (const [ idx, itemRaw ] of Object.entries(input)) {
            context.fork(() => {
                context.parent = input;
                context.propertyKey = undefined;
                context.path = (context.path ? context.path + '.' : '') + idx;
                context.typeDscr = newTypeDscr;
                context.circular = newCircular;
                
                const item = this._serializer._serializeInternal(
                    itemRaw,
                    context,
                );
                
                if (
                    item !== undefined
                    && item !== null
                ) {
                    output.push(item);
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
        if (!isIterable(input)) {
            context.stopProcessing = true;
            return [];
        }
        
        const newTypeDscr = { type: context.typeDscr.arrayOf };
        
        const array : any = [];
        for (const [ idx, itemRaw ] of Object.entries(input)) {
            context.fork(() => {
                context.parent = input;
                context.propertyKey = undefined;
                context.path = (context.path ? context.path + '.' : '') + idx;
                context.typeDscr = newTypeDscr;
                
                const item = this._serializer._deserializeInternal(
                    itemRaw,
                    context,
                );
                
                if (
                    item !== undefined
                    && item !== null
                ) {
                    array.push(item);
                }
            });
        }
        
        context.stopProcessing = true;
        
        return array;
    }
    
}
