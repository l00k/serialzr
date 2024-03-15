import type { ComputedGetterFn, TransformerFnParams } from '../def.js';
import { Transformer } from './Transformer.js';

export function Computed (
    getterFn : ComputedGetterFn
) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        Transformer({
            toPlain: (value : any, params : TransformerFnParams) => {
                if (value !== undefined) {
                    return [ value, true ]; // already defined
                }
                
                const computed = getterFn({
                    value,
                    parent: params.context.parent,
                    params
                });
                return [ computed, true ];
            }
        })(target, propertyKey, descriptor);
    };
}
