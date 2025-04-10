import type { ComputedGetterFn, PropTransformerFnParams } from '../def.js';
import { Transformer } from './Transformer.js';

export function ComputedByGroups (
    groups : string[],
    ifIncludesFn : ComputedGetterFn = () => true,
    ifNotIncludesFn : ComputedGetterFn = () => false,
) : PropertyDecorator
{
    return (target : any, propertyKey : string | symbol) => {
        Transformer({
            serialize: (value : any, params : PropTransformerFnParams) => {
                if (value !== undefined) {
                    // already defined
                    return { output: value, final: true };
                }
                
                const includesGroup : boolean = groups.some(g => params.context.groups.includes(g));
                
                let output : any = undefined;
                if (includesGroup) {
                    output = ifIncludesFn({
                        value,
                        parent: params.context.parent,
                        params,
                    });
                }
                else {
                    output = ifNotIncludesFn({
                        value,
                        parent: params.context.parent,
                        params,
                    });
                }
                
                return { output, final: true };
            },
        })(target, propertyKey);
    };
}
