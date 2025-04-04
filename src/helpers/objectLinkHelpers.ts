import type { ParsedObjectLink , TypeDefinition } from '$/def.js';
import { Exception } from '$/helpers/Exception.js';
import { Registry } from '$/Registry.js';

export function buildObjectLink (
    source : any,
    typeDef : TypeDefinition,
    allowBlank : boolean = true,
) : string
{
    const id = source[typeDef.idProperty];
    if (id === undefined) {
        if (allowBlank) {
            return undefined;
        }
        else {
            throw new Exception(
                'Id value not specified',
                1743360679287,
            );
        }
    }
    
    return '@/' + typeDef.name + '/' + id;
}

export function parseObjectLink (objectLink : string) : ParsedObjectLink
{
    if (!objectLink.startsWith('@/')) {
        throw new Exception(
            'Wrong format of object link',
            1743360099255,
        );
    }
    
    objectLink = objectLink.substring(2);
    
    const registry = Registry.getSingleton();
    
    const lastSlashIdx = objectLink.lastIndexOf('/');
    const typeName = objectLink.substring(0, lastSlashIdx);
    const idRaw = objectLink.substring(lastSlashIdx + 1);
    
    const type = registry.getTypeByName(typeName);
    if (!type) {
        throw new Exception(
            'Unknown type: ' + type.name,
            1743360231473,
        );
    }
    
    const typeDef = registry.getTypeDefinition(type);
    if (!typeDef) {
        throw new Exception(
            'Unknown type: ' + type.name,
            1743360244832,
        );
    }
    
    const idPropName = typeDef.idProperty;
    if (!idPropName) {
        throw new Exception(
            'There is no defined property for type: ' + type.name,
            1743360388303,
        );
    }
    
    const idPropTypeDef = registry.getPropertyDefinition(type, idPropName);
    const idPropType = idPropTypeDef.type?.type
        ? idPropTypeDef.type?.type()
        : String
    ;
    
    const id = idPropType == Number
        ? Number(idRaw)
        : idRaw
    ;
    
    return {
        type,
        id,
    };
}
