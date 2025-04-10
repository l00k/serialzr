import { prepareSerializerContext } from '#/test-helper.js';
import { BaseTransformer, Direction, Registry } from '$/index.js';


prepareSerializerContext('Decorators', () => {
    describe('RegisterTransformer', () => {
        
        class FooTransformer extends BaseTransformer
        {
            public readonly serializeOrder : number = -20;
            public readonly deserializeOrder : number = -10;
            
            public preflight () : boolean
            {
                return true;
            }
            
            public serialize () : any
            {
                return undefined;
            }
            
            public deserialize () : any
            {
                return undefined;
            }
        }
        
        it('Should properly register deserializer', () => {
            const registry = Registry.getSingleton();
            
            registry.registerTransformers(FooTransformer);
            
            const entry = registry.getTransformers(Direction.Deserialize)
                .find(e => e instanceof FooTransformer)
            ;
            expect(entry).to.exist;
        });
        
        it('Should properly register serializer', () => {
            const registry = Registry.getSingleton();
            
            registry.registerTransformers(FooTransformer);
            
            const entry = registry.getTransformers(Direction.Serialize)
                .find(e => e instanceof FooTransformer)
            ;
            expect(entry).to.exist;
        });
        
    });
});
