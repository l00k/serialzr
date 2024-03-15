import type { ComputedGetterFn, TransformerFnParams } from '../def.js';
import { Transformer } from './Transformer.js';

export function ComputedByGroup (
    group : string,
    ifIncludesFn : ComputedGetterFn = () => true,
    ifNotIncludesFn : ComputedGetterFn = () => false,
) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        Transformer({
            toPlain: (value : any, params : TransformerFnParams) => {
                if (value !== undefined) {
                    return [ value, true ]; // already defined
                }
                
                let computed : any = undefined;
                
                if (params.context.groups.includes(group)) {
                    computed = ifIncludesFn({
                        value,
                        parent: params.context.parent,
                        params
                    });
                }
                else {
                    computed = ifNotIncludesFn({
                        value,
                        parent: params.context.parent,
                        params
                    });
                }
                
                return [ computed, true ];
            }
        })(target, propertyKey, descriptor);
    };
};
