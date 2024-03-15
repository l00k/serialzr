import { MetadataStorage, serializer } from '$/index.js';


function cleanupMetadataStorage () : MetadataStorage
{
    const backup = MetadataStorage.getSingleton();
    
    MetadataStorage['__singleton'] = null;
    serializer['_metadataStorage'] = MetadataStorage.getSingleton();
    
    return backup;
}

function restoreMetadataStorage (backup : MetadataStorage) : void
{
    MetadataStorage['__singleton'] = backup;
    serializer['_metadataStorage'] = backup;
}

export function registerSerializerTests (
    name : string,
    fn : Function
) : void
{
    const backupGlobal : MetadataStorage = cleanupMetadataStorage();
    
    describe(name, () => {
        fn();
        
        const backupLocal : MetadataStorage = cleanupMetadataStorage();
        
        beforeEach(() => {
            restoreMetadataStorage(backupLocal);
        });
        
        after(() => {
            restoreMetadataStorage(backupGlobal);
        });
    });
}
