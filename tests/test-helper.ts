import { Registry, serializer } from '$/index.js';
import { registerBuiltInTransformers } from '$/registerBuiltInTransformers.js';
import { after } from 'mocha';

function cleanupRegistry () : Registry
{
    Registry['__singleton'] = null;
    const newRegistry = Registry.getSingleton();
    
    serializer['_registry'] = newRegistry;
    serializer['_objectLinkProcessor']['_registry'] = newRegistry;
    
    registerBuiltInTransformers();
    
    return newRegistry;
}

function restoreRegistry (backup : Registry) : void
{
    Registry['__singleton'] = backup;
    serializer['_registry'] = backup;
    serializer['_objectLinkProcessor']['_registry'] = backup;
}

export function prepareSerializerContext (
    name : string,
    fn : any,
) : void
{
    describe(name, () => {
        const registry = cleanupRegistry();
        
        beforeEach(() => {
            restoreRegistry(registry);
            
            serializer['_initiated'] = false;
            serializer.init({
                typeProperty: '@type',
                objectLinkProperty: '@id',
                useObjectLink: false,
            });
        });
        
        after(() => {
            cleanupRegistry();
        });
        
        fn();
    });
}
