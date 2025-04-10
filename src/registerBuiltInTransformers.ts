import { Registry } from './Registry.js';
import {
    ArrayTransformer,
    AutoDetectTypeTransformer,
    AutoGroupsTransformer,
    BuiltInTypeTransformer,
    CircularDependencyTransformer,
    ExpositionTransformer,
    ObjectLinkTransformer,
    ObjectTransformer,
    PropertyAfterTransformer,
    PropertyBeforeTransformer,
    RecordTransformer,
    ReduceToObjectLinkTransformer,
    TrivialValueTransformer,
} from './transformers/index.js';

export function registerBuiltInTransformers () : void
{
    const registry = Registry.getSingleton();
    
    // -900
    registry.registerTransformers(AutoDetectTypeTransformer);
    // -800
    registry.registerTransformers(ExpositionTransformer);
    // -700
    registry.registerTransformers(ArrayTransformer);
    registry.registerTransformers(RecordTransformer);
    // -600
    registry.registerTransformers(CircularDependencyTransformer);
    // -500
    registry.registerTransformers(AutoGroupsTransformer);
    // -400
    registry.registerTransformers(PropertyBeforeTransformer);
    // -300
    registry.registerTransformers(TrivialValueTransformer);
    // -200
    registry.registerTransformers(BuiltInTypeTransformer);
    // -100
    registry.registerTransformers(ObjectLinkTransformer);
    // 0
    registry.registerTransformers(ObjectTransformer);
    // 100
    registry.registerTransformers(ReduceToObjectLinkTransformer);
    // 400
    registry.registerTransformers(PropertyAfterTransformer);
}
