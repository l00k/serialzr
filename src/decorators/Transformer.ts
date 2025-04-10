import type { PropTransformerFn, PropTransformerGroup } from '$/def.js';
import { Registry } from '$/Registry.js';

type PropTransformerDscrOpt = {
    serialize? : PropTransformerGroup | PropTransformerFn,
    deserialize? : PropTransformerGroup | PropTransformerFn,
};

function Transformer (transformerDscrOpt : PropTransformerDscrOpt) : PropertyDecorator
{
    return (target : any, propertyKey : PropertyKey) => {
        const constructor = target.constructor;
        
        if (typeof transformerDscrOpt.serialize == 'function') {
            transformerDscrOpt.serialize = { before: transformerDscrOpt.serialize };
        }
        if (typeof transformerDscrOpt.deserialize == 'function') {
            transformerDscrOpt.deserialize = { before: transformerDscrOpt.deserialize };
        }
        
        const registry = Registry.getSingleton();
        
        registry.registerPropertyTransformers(
            constructor,
            propertyKey,
            <any>transformerDscrOpt,
        );
    };
}

type PropTransformerOpt = PropTransformerFn | PropTransformerGroup;

Transformer.Deserialize = function(transformerOpt : PropTransformerOpt) : any {
    const transformerGroup : PropTransformerGroup = typeof transformerOpt === 'function'
        ? { before: transformerOpt }
        : <any>transformerOpt
    ;
    
    return Transformer({ deserialize: transformerGroup });
};

Transformer.Serialize = function <T = any> (transformerOpt : PropTransformerOpt) : any {
    const transformerGroup : PropTransformerGroup = typeof transformerOpt === 'function'
        ? { before: transformerOpt }
        : <any>transformerOpt
    ;
    
    return Transformer({ serialize: transformerGroup });
};


export { Transformer };
