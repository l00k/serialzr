import type { TargetType, TypedClassDecorator, TypeDefinition, TypeFn } from '../def.js';
import { Registry } from '../Registry.js';


type TypeDefinitionOpts<T> = Partial<TypeDefinition> & {
    idProperty? : keyof T,
};

function Type<T> (typeName? : string) : TypedClassDecorator<T>;
function Type<T> (typeDef : TypeDefinitionOpts<T>) : TypedClassDecorator<T>;
function Type (targetType : TargetType | TypeFn) : PropertyDecorator;


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
            
            registry
                .registerType(
                    constructor,
                    typeDef,
                );
        }
        else {
            let [ targetType ] = decorArguments;
            
            if (targetType instanceof Function) {
                targetType = { type: targetType };
            }
        
            if (descriptor) {
                registry
                    .registerPropertyDescriptor(
                        constructor,
                        propertyKey,
                        descriptor,
                    );
            }
            
            registry
                .registerPropertyType(
                    constructor,
                    propertyKey,
                    targetType,
                );
        }
    };
}



export { Type };
