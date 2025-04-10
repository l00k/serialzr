import type { Context } from '$/Context.js';
import type { PropertyDefinition } from '$/def.js';
import { getChildExpositionGraph } from '$/helpers/index.js';
import { BaseTransformer } from './BaseTransformer.js';

export class ObjectTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = 0;
    public readonly deserializeOrder : number = 0;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return true;
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
        
        // build plain object
        const plain : any = {};
        
        // add built-in properties
        if (context.typeDef) {
            if (context.typeDef.name) {
                plain[context.options.typeProperty] = context.typeDef.name;
            }
            
            if (context.typeDef.idProperty) {
                if (context.options.useObjectLink) {
                    plain[context.options.objectLinkProperty] = this._objectLinkProcessor.build(
                        input,
                        true,
                        context.typeDef,
                    );
                }
                
                plain[context.typeDef.idProperty] = input[context.typeDef.idProperty];
            }
        }
        
        // collect all suitable props
        const type = context.typeDscr.type();
        const allProps = this._registry.getAllProperties(type);
        
        // add properties from source
        const excludeExtraneous = context.typeDef?.modifiers.excludeExtraneous
            ?? context.options.excludeExtraneous
        ;
        if (!excludeExtraneous || context.forceExpose) {
            Object.keys(input)
                .forEach(propKey => allProps.add(propKey))
            ;
        }
        
        const newCircular = [ ...context.circular, input ];
        
        for (const propKey of allProps) {
            // only if property exists in input
            if (!(propKey in input)) {
                continue;
            }
            
            context.fork(() => {
                const propDef : PropertyDefinition = this._registry.getPropertyDefinition(
                    type,
                    propKey,
                );
                
                // detect non-readable prop
                const dscr = propDef?.descriptor;
                if (dscr) {
                    if (dscr.set && !dscr.get) {
                        // skip
                        return;
                    }
                }
                
                // serializer inner
                let valueToSet : any;
                if (propDef.modifiers.forceRaw) {
                    valueToSet = input[propKey];
                }
                else {
                    context.parent = input;
                    context.propertyKey = propKey;
                    context.path = (context.path ? context.path + '.' : '') + propKey.toString();
                    context.depth = context.depth + 1;
                    context.circular = newCircular;
                    context.typeDscr = propDef.typeDscr;
                    context.propDef = propDef;
                    
                    if (context.typeDef?.modifiers.defaultStrategy !== undefined) {
                        context.defaultStrategy = context.typeDef.modifiers.defaultStrategy;
                    }
                    
                    if (context.graph !== undefined) {
                        // prepare child graph
                        context.graph = getChildExpositionGraph(
                            context.graph,
                            propKey,
                        );
                    }
                    
                    valueToSet = this._serializer._serializeInternal(
                        input[propKey],
                        context,
                    );
                }
                
                if (valueToSet !== undefined) {
                    plain[propKey] = valueToSet;
                }
            });
        }
        
        return plain;
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
        
        // create target instance
        let instance = null;
        
        const type = context.typeDscr.type();
        if (!type || input instanceof type) {
            // use provided instance
            instance = input;
        }
        else {
            // new instance of type
            const keepInitialValues = context.typeDef?.modifiers.keepInitialValues
                ?? context.options.keepInitialValues
            ;
            if (keepInitialValues) {
                instance = new type();
            }
            else {
                instance = Object.create(type.prototype);
            }
        }
        
        const allProps = this._registry.getAllProperties(type);
        
        // add properties from source
        const excludeExtraneous = input.typeDef?.modifiers.excludeExtraneous
            ?? context.options.excludeExtraneous
        ;
        if (!excludeExtraneous || context.forceExpose) {
            Object.keys(input)
                .filter(propKey => {
                    // skip special props
                    return context.options.objectLinkProperty != propKey
                        && context.options.typeProperty != propKey;
                })
                .forEach(propKey => allProps.add(propKey))
            ;
        }
        
        for (const propKey of allProps) {
            // only if property exists in input
            if (!(propKey in input)) {
                continue;
            }
            
            context.fork(() => {
                const propDef : PropertyDefinition = this._registry.getPropertyDefinition(
                    type,
                    propKey,
                );
                
                // detect non-writable prop
                const dscr = propDef?.descriptor;
                if (dscr) {
                    if (dscr.get && !dscr.set) {
                        // skip
                        return;
                    }
                }
                
                // deserializer inner
                let targetValue : any;
                if (propDef.modifiers.forceRaw) {
                    targetValue = input[propKey];
                }
                else {
                    // prepare child context
                    context.parent = input;
                    context.path = (context.path ? context.path + '.' : '') + propKey.toString();
                    context.depth = context.depth + 1;
                    context.propertyKey = propKey;
                    context.typeDscr = propDef.typeDscr;
                    context.propDef = propDef;
                    
                    if (context.typeDef?.modifiers.defaultStrategy !== undefined) {
                        context.defaultStrategy = context.typeDef.modifiers.defaultStrategy;
                    }
                    
                    if (context.graph !== undefined) {
                        // prepare child graph
                        context.graph = getChildExpositionGraph(
                            context.graph,
                            propKey,
                        );
                    }
                    
                    targetValue = this._serializer._deserializeInternal(
                        input[propKey],
                        context,
                    );
                    
                    if (targetValue === undefined) {
                        // skip
                        return;
                    }
                }
                
                if (
                    propDef.modifiers.objectMerge
                    && instance[propKey] instanceof Object
                ) {
                    Object.assign(instance[propKey], targetValue);
                }
                else if (
                    propDef.modifiers.arrayAppend
                    && Array.isArray(instance[propKey])
                ) {
                    instance[propKey].push(...targetValue);
                }
                else {
                    instance[propKey] = targetValue;
                }
            });
        }
        
        return instance;
    }
    
}
