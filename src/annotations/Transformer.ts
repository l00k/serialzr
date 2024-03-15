import type { TransformerFn } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';

type TransformerDscr<S = any, R = any> = TransformerFn<S, R> | {
    before? : TransformerFn<S, R>,
    after? : TransformerFn<S, R>,
};

type Transformers<T = any> = {
    toClass? : TransformerDscr<any, T>,
    toPlain? : TransformerDscr<T, any>,
};

function Transformer<T = any> (transformers : Transformers<T>) : any
{
    return (target : any, propertyKey? : PropertyKey, descriptor? : PropertyDescriptor) => {
        if (typeof transformers.toPlain == 'function') {
            transformers.toPlain = { before: transformers.toPlain };
        }
        if (typeof transformers.toClass == 'function') {
            transformers.toClass = { before: transformers.toClass };
        }
        
        const metadataStorage = MetadataStorage.getSingleton();
        
        if (propertyKey) {
            const constructor = target.constructor;
            
            if (descriptor) {
                metadataStorage
                    .registerPropertyDescriptor(
                        constructor,
                        propertyKey,
                        descriptor
                    );
            }
            
            metadataStorage
                .registerPropertyTransformers(
                    constructor,
                    propertyKey,
                    <any>transformers
                );
        }
        else {
            metadataStorage
                .registerTypeTransformers(
                    target,
                    <any>transformers
                );
        }
    };
}


Transformer.ToClass = function <T extends Object = any> (transformer : TransformerDscr<any, T>) : any {
    return Transformer({ toClass: transformer });
};

Transformer.ToPlain = function <T extends Object = any> (transformer : TransformerDscr<T, any>) : any {
    return Transformer({ toPlain: transformer });
};


export { Transformer };
