import type { ComputedGetterFn, PropTransformerFnParams } from '../def.js';
import { Transformer } from './Transformer.js';

export function Computed (
    getterFn : ComputedGetterFn,
) : PropertyDecorator
{
    return (target : any, propertyKey : string | symbol) => {
        Transformer({
            serialize: (value : any, params : PropTransformerFnParams) => {
                if (value !== undefined) {
                    // already defined
                    return { output: value, final: true };
                }
                
                const output = getterFn({
                    value,
                    parent: params.context.parent,
                    params,
                });
                
                return { output, final: true };
            },
        })(target, propertyKey);
    };
}
