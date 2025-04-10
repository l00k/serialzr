import type { Context } from '$/Context.js';
import type { ClassConstructor } from '$/def.js';
import { getClassesFromChain } from '$/helpers/index.js';
import { BaseTransformer } from './BaseTransformer.js';


export class AutoDetectTypeTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -900;
    public readonly deserializeOrder : number = -900;
    
    
    public preflight () : boolean
    {
        return true;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        if (context.typeDscr) {
            if (context.typeDscr.type) {
                let inputType = input?.constructor;
                
                const typeRestriction = context.typeDscr.type();
                if (typeRestriction) {
                    // type restricted by context (parent)
                    const chainClasses = getClassesFromChain(inputType);
                    inputType = chainClasses.includes(typeRestriction) // allow only classes from the same chain
                        ? inputType
                        : typeRestriction
                    ;
                }
                
                context.typeDscr = { type: () => inputType };
                
                context.typeDef = inputType
                    ? this._registry.getTypeDefinition(inputType)
                    : null
                ;
            }
        }
        else if (input instanceof Array) {
            context.typeDscr = { arrayOf: () => undefined };
        }
        else {
            const inputType = input?.constructor;
            context.typeDscr = { type: () => inputType };
            
            if (inputType) {
                context.typeDef = inputType
                    ? this._registry.getTypeDefinition(inputType)
                    : null
                ;
            }
        }
        
        return input;
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        if (!context.typeDscr) {
            if (input instanceof Array) {
                context.typeDscr = { arrayOf: () => undefined };
                return input;
            }
        }
        
        if (
            context.typeDscr
            && (
                context.typeDscr.arrayOf
                || context.typeDscr.recordOf
            )
        ) {
            return input;
        }
        
        const providedTypeName = input instanceof Object
            ? input[context.options.typeProperty]
            : null
        ;
        
        let providedType : ClassConstructor = input?.constructor;
        if (providedTypeName) {
            providedType = this._registry.getTypeByName(providedTypeName);
        }
        
        if (context.typeDscr) {
            let finalType = context.typeDscr.type?.();
            if (finalType) {
                if (providedType) {
                    // verify is it subclass - only classes from the same chain are allowed
                    const chainClasses = getClassesFromChain(providedType);
                    if (chainClasses.includes(finalType)) {
                        finalType = providedType;
                    }
                }
                
                context.typeDscr = { type: () => finalType };
                context.typeDef = this._registry.getTypeDefinition(finalType);
                
                return input;
            }
        }
        
        // return provided type
        if (providedType) {
            context.typeDscr = { type: () => providedType };
            context.typeDef = this._registry.getTypeDefinition(providedType);
        }
        else {
            context.typeDscr = undefined;
            context.typeDef = undefined;
        }
        
        return input;
    }
    
}
