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
        
        const registry = Registry.getSingleton();
        registry.registerAutoGroupFn(
            target,
            { groups, fn },
        );
    };
}
