import type { TargetType, TypeFn } from '$/def.js';
import { MetadataStorage } from '../MetadataStorage.js';


export function Id (targetType? : TargetType | TypeFn) : PropertyDecorator
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
        
        if (targetType) {
            if (targetType instanceof Function) {
                targetType = { type: targetType };
            }
            
            metadataStorage.registerPropertyType(
                constructor,
                propertyKey,
                targetType
            );
        }
        
        metadataStorage
            .registerPropertyExpose(
                constructor,
                propertyKey,
                { mode: true }
            );
        
        metadataStorage
            .registerIdProperty(
                constructor,
                propertyKey
            );
    };
}
