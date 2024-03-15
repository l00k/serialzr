import type { AutoGroupFn, TypedClassDecorator } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';


export function AutoGroup<T> (
    groups : string | string[],
    fn : AutoGroupFn<T>
) : TypedClassDecorator<T>
{
    return (target : any) => {
        if (typeof groups == 'string') {
            groups = [ groups ];
        }
        
        MetadataStorage.getSingleton()
            .registerAutoGroupFn(
                target,
                { groups, fn }
            );
    };
}
