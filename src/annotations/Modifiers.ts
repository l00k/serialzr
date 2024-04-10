import { MetadataStorage } from '$/MetadataStorage.js';
import type { PropertyModifiers, TypeModifiers } from '../def.js';

export function Modifiers (modifiers : PropertyModifiers) : PropertyDecorator;
export function Modifiers (modifiers : TypeModifiers) : ClassDecorator;

export function Modifiers () : ClassDecorator | PropertyDecorator
{
    const [ modifiers ] = arguments;
    
    return function(target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const metadataStorage = MetadataStorage.getSingleton();
        
        if (arguments.length === 1) {
            metadataStorage
                .registerTypeModifiers(
                    constructor,
                    modifiers
                );
        }
        else {
            if (descriptor) {
                metadataStorage
                    .registerPropertyDescriptor(
                        constructor,
                        propertyKey,
                        descriptor
                    );
            }
            
            metadataStorage
                .registerPropertyModifiers(
                    constructor,
                    propertyKey,
                    modifiers
                );
        }
    };
}
