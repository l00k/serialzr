import type { TypedClassDecorator, TypeDefinition, TypeDscr, TypeFn } from '../def.js';
import { Registry } from '../Registry.js';


function Type<T extends object> (typeDef : Partial<TypeDefinition<T>>) : TypedClassDecorator<T>;
function Type<T> (typeName? : string) : TypedClassDecorator<T>;
function Type (typeDscr : TypeDscr | TypeFn) : PropertyDecorator;


function Type<T> (...decorArguments : any[]) : PropertyDecorator | TypedClassDecorator<T>
{
    return function(target : any, propertyKey? : PropertyKey, descriptor? : PropertyDescriptor) {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const registry = Registry.getSingleton();
        
        if (arguments.length === 1) {
            let [ typeDef ] = decorArguments;
            
            if (!typeDef) {
                typeDef = {};
            }
            
            if (typeof typeDef == 'string') {
                typeDef = { name: typeDef };
            }
            
            registry.registerType(
                constructor,
                typeDef,
            );
        }
        else {
            let [ typeDscr ] = decorArguments;
            
            if (typeDscr instanceof Function) {
                typeDscr = { type: typeDscr };
            }
            
            if (descriptor) {
                registry.registerPropertyDescriptor(
                    constructor,
                    propertyKey,
                    descriptor,
                );
            }
            
            registry.registerPropertyType(
                constructor,
                propertyKey,
                typeDscr,
            );
        }
    };
}



export { Type };
