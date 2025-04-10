import { prepareSerializerContext } from '#/test-helper.js';
import { Registry , serializer, Srlz } from '$/index.js';


prepareSerializerContext('Decorator / Transformer', () => {
    function sample () : any {}
    
    let registry : Registry;
    beforeEach(() => {
        registry = Registry.getSingleton();
    });
    
    it('Complex', () => {
        class Foo
        {
            @Srlz.Transformer({
                deserialize: {
                    before: sample,
                    after: sample,
                },
                serialize: {
                    before: sample,
                    after: sample,
                },
            })
            public foo : number = 0;
        }
        
        const propDef = registry.getPropertyDefinition(Foo, 'foo');
        expect(propDef.transformers).to.be.deep.equal({
            deserialize: {
                before: sample,
                after: sample,
            },
            serialize: {
                before: sample,
                after: sample,
            },
        });
    });
    
    it('Shorthand group', () => {
        class Foo
        {
            @Srlz.Transformer.Deserialize({
                before: sample,
                after: sample,
            })
            @Srlz.Transformer.Serialize({
                before: sample,
                after: sample,
            })
            public foo : number = 0;
        }
        
        const propDef = registry.getPropertyDefinition(Foo, 'foo');
        expect(propDef.transformers).to.be.deep.equal({
            deserialize: {
                before: sample,
                after: sample,
            },
            serialize: {
                before: sample,
                after: sample,
            },
        });
    });
    
    it('Shorthand fn', () => {
        class Foo
        {
            @Srlz.Transformer.Deserialize(sample)
            @Srlz.Transformer.Serialize(sample)
            public foo : number = 0;
        }
        
        const propDef = registry.getPropertyDefinition(Foo, 'foo');
        expect(propDef.transformers).to.be.deep.equal({
            deserialize: {
                before: sample,
            },
            serialize: {
                before: sample,
            },
        });
    });
    
});
