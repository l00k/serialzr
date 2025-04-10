import { Registry } from '$/Registry.js';
import type { PropertyModifiers, TypedClassDecorator, TypeModifiers } from '../def.js';

function Modifiers<T extends object> (modifiers : TypeModifiers) : TypedClassDecorator<T>;
function Modifiers (modifiers : PropertyModifiers) : PropertyDecorator;

function Modifiers<T> (...decorArguments : any[]) : PropertyDecorator | TypedClassDecorator<T>
{
    return function(target : any, propertyKey? : PropertyKey, descriptor? : PropertyDescriptor) {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const [ modifiers ] = decorArguments;
        
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

export { Modifiers };
