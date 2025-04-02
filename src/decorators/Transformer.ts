import type { PropTransformerFn } from '../def.js';
import { Registry } from '../Registry.js';

type TransformerDscr<S = any, R = any> = PropTransformerFn<S, R> | {
    before? : PropTransformerFn<S, R>,
    after? : PropTransformerFn<S, R>,
};

type Transformers<T = any> = {
    toClass? : TransformerDscr<any, T>,
    toPlain? : TransformerDscr<T, any>,
};

function Transformer<T = any> (transformers : Transformers<T>) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.constructor;
        
        if (typeof transformers.toPlain == 'function') {
            transformers.toPlain = { before: transformers.toPlain };
        }
        if (typeof transformers.toClass == 'function') {
            transformers.toClass = { before: transformers.toClass };
        }
        
        const registry = Registry.getSingleton();
        
        registry
            .registerPropertyTransformers(
                constructor,
                propertyKey,
                <any>transformers,
            );
    };
}


Transformer.ToClass = function <T extends object = any> (transformer : TransformerDscr<any, T>) : any {
    return Transformer({ toClass: transformer });
};

Transformer.ToPlain = function <T extends object = any> (transformer : TransformerDscr<T, any>) : any {
    return Transformer({ toPlain: transformer });
};


export { Transformer };
