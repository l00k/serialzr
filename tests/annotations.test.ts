import { prepareSerializerContext } from '#/test-helper.js';
import { MetadataStorage, Srlz } from '$/index.js';


prepareSerializerContext('Annotations', () => {
    describe('Transform', () => {
        const fn = (obj : any) => obj.constructor.name;
        
        it('should uniform toPlain transformer', () => {
            @Srlz.Transformer({ toPlain: fn })
            class Foo {}
            
            const typeDefinition = MetadataStorage.getSingleton()
                .getTypeDefinition(Foo);
            
            expect(typeDefinition.transformers).to.be.deep.equal({
                toPlain: { before: fn }
            });
        });
        
        it('should uniform toClass transformer', () => {
            @Srlz.Transformer({ toClass: fn })
            class Foo {}
            
            const typeDefinition = MetadataStorage.getSingleton()
                .getTypeDefinition(Foo);
            
            expect(typeDefinition.transformers).to.be.deep.equal({
                toClass: { before: fn }
            });
        });
        
        it('should properly assign in ToPlain variant', () => {
            @Srlz.Transformer.ToPlain(fn)
            class Foo {}
            
            const typeDefinition = MetadataStorage.getSingleton()
                .getTypeDefinition(Foo);
            
            expect(typeDefinition.transformers).to.be.deep.equal({
                toPlain: { before: fn }
            });
        });
        
        it('should properly assign in ToClass variant', () => {
            @Srlz.Transformer.ToClass(fn)
            class Foo {}
            
            const typeDefinition = MetadataStorage.getSingleton()
                .getTypeDefinition(Foo);
            
            expect(typeDefinition.transformers).to.be.deep.equal({
                toClass: { before: fn }
            });
        });
        
    });
});
