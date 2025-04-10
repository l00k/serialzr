import type { Context } from '$/Context.js';
import { Direction } from '$/def.js';
import { BaseTransformer } from './BaseTransformer.js';


export class BuiltInTypeTransformer extends BaseTransformer
{
    
    public static readonly TYPES : any[] = [
        Boolean,
        Number,
        String,
        Date,
        BigInt,
    ];
    
    
    public readonly serializeOrder : number = -200;
    public readonly deserializeOrder : number = -200;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        const type = context.typeDscr.type();
        
        return BuiltInTypeTransformer.TYPES.includes(type)
            || (
                !type
                && BuiltInTypeTransformer.TYPES.includes(input.constructor)
            );
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        return this._transformBuiltIn(
            input,
            context.typeDscr.type(),
            Direction.Serialize,
        );
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        context.stopProcessing = true;
        
        return this._transformBuiltIn(
            input,
            context.typeDscr.type(),
            Direction.Deserialize,
        );
    }
    
    protected _transformBuiltIn (
        input : any,
        type : any,
        direction : Direction,
    ) : any
    {
        if (type == Number) {
            if (typeof input == 'number') {
                return input;
            }
            return Number(input);
        }
        else if (type == String) {
            if (typeof input == 'string') {
                return input;
            }
            return String(input);
        }
        else if (type == Boolean) {
            if (typeof input == 'boolean') {
                return input;
            }
            else if (typeof input == 'string') {
                return input == 'true';
            }
            return !!input;
        }
        else if (type == Date) {
            if (direction == Direction.Serialize) {
                return input instanceof Date
                    ? input.toISOString()
                    : undefined
                    ;
            }
            else {
                return [ 'string', 'number' ].includes(typeof input)
                    ? new Date(input)
                    : undefined
                    ;
            }
        }
        else if (type == BigInt) {
            if (direction == Direction.Serialize) {
                return input.constructor == BigInt
                    ? input.toString(10)
                    : undefined
                    ;
            }
            else {
                return [ 'string', 'number' ].includes(typeof input)
                    ? BigInt(input)
                    : undefined
                    ;
            }
        }
    }
    
}
