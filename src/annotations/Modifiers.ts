import { MetadataStorage } from '$/MetadataStorage.js';
import type { ModifiersDef } from '../def.js';

export function Modifiers (
    modifiers : ModifiersDef = {}
) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        const constructor = target.constructor;
        
        const metadataStorage = MetadataStorage.getSingleton();
        
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
    };
}
