import { registerBuiltInTransformers, Registry, serializer } from '$/index.js';
import { after } from 'mocha';

function cleanupRegistry () : Registry
{
    Registry['__singleton'] = null;
    const newRegistry = Registry.getSingleton();
    
    serializer['_registry'] = newRegistry;
    
    registerBuiltInTransformers();
    
    return newRegistry;
}

function restoreRegistry (backup : Registry) : void
{
    Registry['__singleton'] = backup;
    serializer['_registry'] = backup;
}

export function prepareSerializerContext (
    name : string,
    fn : any,
) : void
{
    describe(name, () => {
        const context = cleanupRegistry();
        
        beforeEach(() => {
            serializer['_initiated'] = false;
            serializer.init({
                typeProperty: '@type',
                objectLinkProperty: '@id',
                useObjectLink: false,
            });
            
            restoreRegistry(context);
        });
        
        after(() => {
            cleanupRegistry();
        });
        
        fn();
    });
}
