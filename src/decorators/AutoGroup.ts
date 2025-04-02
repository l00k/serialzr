import type { AutoGroupFn, TypedClassDecorator } from '../def.js';
import { Registry } from '../Registry.js';


export function AutoGroup<T> (
    groups : string | string[],
    fn : AutoGroupFn<T>,
) : TypedClassDecorator<T>
{
    return (target : any) => {
        if (typeof groups == 'string') {
            groups = [ groups ];
        }
        
        Registry.getSingleton()
            .registerAutoGroupFn(
                target,
                { groups, fn },
            );
    };
}
