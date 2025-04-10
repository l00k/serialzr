import { prepareSerializerContext } from '#/test-helper.js';
import { Registry, Srlz } from '$/index.js';


prepareSerializerContext('Type', () => {
    @Srlz.Type()
    class ParentClass {}
    
    @Srlz.Type()
    class ChildClass
        extends ParentClass {}
    
    const registry = Registry.getSingleton();
    
    
    it('should register type with proper implict name', () => {
        const typeDef = registry.getTypeDefinition(ParentClass);
        expect(typeDef.name).to.be.equal('ParentClass');
    });
    
    it('should register subclass type with proper implict name', () => {
        const typeDef = registry.getTypeDefinition(ChildClass);
        expect(typeDef.name).to.be.equal('ParentClass/ChildClass');
    });
});
