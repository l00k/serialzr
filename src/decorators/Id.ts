import type { TargetType, TypeFn } from '$/def.js';
import { Registry } from '../Registry.js';


export function Id (targetType? : TargetType | TypeFn) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        const constructor = target.constructor;
        const registry = Registry.getSingleton();
        
        if (descriptor) {
            registry
                .registerPropertyDescriptor(
                    constructor,
                    propertyKey,
                    descriptor,
                );
        }
        
        if (targetType) {
            if (targetType instanceof Function) {
                targetType = { type: targetType };
            }
            
            registry.registerPropertyType(
                constructor,
                propertyKey,
                targetType,
            );
        }
        
        registry
            .registerPropertyExpose(
                constructor,
                propertyKey,
                { mode: true },
            );
        
        registry
            .registerIdProperty(
                constructor,
                propertyKey,
            );
    };
}
