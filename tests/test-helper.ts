import { Registry, serializer } from '$/index.js';


function cleanupRegistry () : Registry
{
    const backup = Registry.getSingleton();
    
    Registry['__singleton'] = null;
    serializer['_registry'] = Registry.getSingleton();
    
    return backup;
}

function restoreRegistry (backup : Registry) : void
{
    Registry['__singleton'] = backup;
    serializer['_registry'] = backup;
}

export function prepareSerializerContext (
    name : string,
    fn : Function
) : void
{
    const backupGlobal : Registry = cleanupRegistry();
    
    describe(name, () => {
        fn();
        
        const backupLocal : Registry = cleanupRegistry();
        
        beforeEach(() => {
            restoreRegistry(backupLocal);
        });
        
        after(() => {
            restoreRegistry(backupGlobal);
        });
    });
}
