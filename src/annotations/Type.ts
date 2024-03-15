import type { TargetType, TypedClassDecorator, TypeDefinition, TypeFn } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';


type TypeDefinitionOpts<T> = Pick<TypeDefinition, 'name'> & {
    idProperty? : keyof T,
};

function Type<T> (typeName? : string) : TypedClassDecorator<T>;
function Type<T> (typeDef : TypeDefinitionOpts<T>) : TypedClassDecorator<T>;
function Type (targetType : TargetType | TypeFn) : PropertyDecorator;


function Type<T> () : ClassDecorator | PropertyDecorator | TypedClassDecorator<T>
{
    const decorArguments = arguments;
    
    return function(target : any, propertyKey? : PropertyKey, descriptor? : PropertyDescriptor) {
        const constructor = target.prototype
            ? target
            : target.constructor
        ;
        
        const metadataStorage = MetadataStorage.getSingleton();
        
        if (arguments.length === 1) {
            let [ typeDef ] = decorArguments;
            
            if (!typeDef) {
                typeDef = {};
            }
            
            if (typeof typeDef == 'string') {
                typeDef = { name: typeDef };
            }
            
            metadataStorage
                .registerType(
                    constructor,
                    typeDef
                );
        }
        else {
            let [ targetType ] = decorArguments;
            
            if (targetType instanceof Function) {
                targetType = { type: targetType };
            }
        
            if (descriptor) {
                metadataStorage
                    .registerPropertyDescriptor(
                        constructor,
                        propertyKey,
                        descriptor
                    );
            }
            
            metadataStorage
                .registerPropertyType(
                    constructor,
                    propertyKey,
                    targetType
                );
        }
    };
}



export { Type };
