import { Registry } from '$/Registry.js';
import type { PropertyModifiers, TypeModifiers } from '../def.js';

export function Modifiers (modifiers : PropertyModifiers) : PropertyDecorator;
export function Modifiers (modifiers : TypeModifiers) : ClassDecorator;

export function Modifiers (modifiers : any) : ClassDecorator | PropertyDecorator
{
    return function(target : any, propertyKey? : PropertyKey, descriptor? : PropertyDescriptor) {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const registry = Registry.getSingleton();
        
        if (arguments.length === 1) {
            registry.registerTypeModifiers(
                constructor,
                modifiers,
            );
        }
        else {
            if (descriptor) {
                registry.registerPropertyDescriptor(
                    constructor,
                    propertyKey,
                    descriptor,
                );
            }
            
            registry.registerPropertyModifiers(
                constructor,
                propertyKey,
                modifiers,
            );
        }
    };
}
