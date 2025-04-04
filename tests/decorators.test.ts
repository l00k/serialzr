import { prepareSerializerContext } from '#/test-helper.js';
import { TransformStage , Direction , BaseTransformer, Registry } from '$/index.js';
import type { TransformationResult } from '$/index.js';


prepareSerializerContext('Decorators', () => {
    describe('RegisterTransformer', () => {
        
        class FooTransformer extends BaseTransformer
        {
            public shouldApply () : boolean
            {
                return true;
            }
            
            public serialize () : TransformationResult
            {
                return undefined;
            }
            
            public deserialize () : TransformationResult
            {
                return undefined;
            }
        }
        
        it('Should properly register deserializer', () => {
            const registry = Registry.getSingleton();
            
            registry.registerTransformers(FooTransformer, {
                serializeOrder: -20,
                deserializeOrder: -10,
            });
            
            const entry = registry.getTransformers(Direction.Deserialize, TransformStage.Before)
                .find(e => e.transformer instanceof FooTransformer)
            ;
            expect(entry).to.exist;
            expect(entry.order).to.be.eql(-10);
        });
        
        it('Should properly register serializer', () => {
            const registry = Registry.getSingleton();
            
            registry.registerTransformers(FooTransformer, {
                serializeOrder: -20,
                deserializeOrder: -10,
            });
            
            const entry = registry.getTransformers(Direction.Serialize, TransformStage.Before)
                .find(e => e.transformer instanceof FooTransformer)
            ;
            expect(entry).to.exist;
            expect(entry.order).to.be.eql(-20);
        });
        
    });
});
