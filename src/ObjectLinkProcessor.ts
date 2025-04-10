import type { ParsedObjectLink, TypeDefinition } from '$/def.js';
import { Exception } from '$/helpers/index.js';
import { Registry } from '$/Registry.js';

export class ObjectLinkProcessor
{
    
    protected _registry : Registry = Registry.getSingleton();
    
    
    public build (
        source : any,
        allowBlank : boolean = true,
        typeDef? : TypeDefinition,
    ) : string
    {
        if (!typeDef) {
            typeDef = this._registry.getTypeDefinition(source.constructor);
        }
        
        if (!typeDef) {
            throw new Exception(
                'Type definition not found',
                1744044581375,
            );
        }
        
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
    
    public parse (objectLink : string) : ParsedObjectLink
    {
        if (!objectLink.startsWith('@/')) {
            throw new Exception(
                'Wrong format of object link',
                1743360099255,
            );
        }
        
        objectLink = objectLink.substring(2);
        
        const lastSlashIdx = objectLink.lastIndexOf('/');
        const typeName = objectLink.substring(0, lastSlashIdx);
        const idRaw = objectLink.substring(lastSlashIdx + 1);
        
        const type = this._registry.getTypeByName(typeName);
        if (!type) {
            throw new Exception(
                'Unknown type: ' + typeName,
                1743360231473,
            );
        }
        
        const typeDef = this._registry.getTypeDefinition(type);
        
        const idPropName = typeDef.idProperty;
        if (!idPropName) {
            throw new Exception(
                'There is no defined property for type: ' + type.name,
                1743360388303,
            );
        }
        
        const idPropTypeDef = this._registry.getPropertyDefinition(type, idPropName);
        const idPropType = idPropTypeDef.typeDscr?.type
            ? idPropTypeDef.typeDscr?.type()
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
    
}
