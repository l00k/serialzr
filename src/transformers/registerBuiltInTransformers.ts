import { Registry } from '$/Registry.js';
import { BigIntTransformer } from './BigIntTransformer.js';
import { BuiltInTypeTransformer } from './BuiltInTypeTransformer.js';
import { DateTransformer } from './DateTransformer.js';
import { NonObjectTransformer } from './NonObjectTransformer.js';
import { ObjectLinkTransformer } from './ObjectLinkTransformer.js';
import { TrivialValueTransformer } from './TrivialValueTransformer.js';
import { UnknownTypeTransformer } from './UnknownTypeTransformer.js';

export function registerBuiltInTransformers () : void
{
    const registry = Registry.getSingleton();
    
    registry.registerTransformers(BigIntTransformer, {
        serializeOrder: -1000,
        deserializeOrder: -1000,
    });
    
    registry.registerTransformers(DateTransformer, {
        serializeOrder: -1000,
        deserializeOrder: -1000,
    });
    
    registry.registerTransformers(BuiltInTypeTransformer, {
        serializeOrder: -900,
        deserializeOrder: -900,
    });
    
    registry.registerTransformers(TrivialValueTransformer, {
        serializeOrder: -900,
        deserializeOrder: -900,
    });
    
    registry.registerTransformers(UnknownTypeTransformer, {
        serializeOrder: -900,
        deserializeOrder: -900,
    });
    
    registry.registerTransformers(ObjectLinkTransformer, {
        serializeOrder: -100,
        deserializeOrder: -100,
    });
    
    registry.registerTransformers(NonObjectTransformer, {
        serializeOrder: -1,
        deserializeOrder: -1,
    });
}
