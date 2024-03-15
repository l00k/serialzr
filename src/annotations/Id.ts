import { MetadataStorage } from '../MetadataStorage.js';


export function Id () : PropertyDecorator
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
