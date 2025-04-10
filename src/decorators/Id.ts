import type { TypeDscr, TypeFn } from '$/def.js';
import { Registry } from '../Registry.js';


export function Id (typeDscr? : TypeDscr | TypeFn) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        const constructor = target.constructor;
        const registry = Registry.getSingleton();
        
        if (descriptor) {
            registry.registerPropertyDescriptor(
                constructor,
                propertyKey,
                descriptor,
            );
        }
        
        if (typeDscr) {
            if (typeDscr instanceof Function) {
                typeDscr = { type: typeDscr };
            }
            
            registry.registerPropertyType(
                constructor,
                propertyKey,
                typeDscr,
            );
        }
        
        registry.registerPropertyExpose(
            constructor,
            propertyKey,
            { expose: true },
        );
        
        registry.registerIdProperty(
            constructor,
            propertyKey,
        );
    };
}
