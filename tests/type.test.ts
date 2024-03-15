import { registerSerializerTests } from '#/test-helper.js';
import { MetadataStorage, Srlz } from '$/index.js';


registerSerializerTests('Type', () => {
    @Srlz.Type()
    class ParentClass {}
    
    @Srlz.Type()
    class ChildClass
        extends ParentClass {}
    
    const metadataStorage = MetadataStorage.getSingleton();
    
    
    it('should register type with proper implict name', () => {
        const typeDef = metadataStorage.getTypeDefinition(ParentClass);
        expect(typeDef.name).to.be.equal('ParentClass');
    });
    
    it('should register subclass type with proper implict name', () => {
        const typeDef = metadataStorage.getTypeDefinition(ChildClass);
        expect(typeDef.name).to.be.equal('ParentClass/ChildClass');
    });
});
