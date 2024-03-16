import { prepareSerializerContext } from '#/test-helper.js';
import { Srlz, serializer } from '$/index.js';


prepareSerializerContext('Basics', () => {
    after(() => {
        serializer['_initiated'] = false;
        serializer.init();
    });
    
    @Srlz.Type('sample')
    class Foo {}
    
    it('should assign type property', () => {
        serializer['_initiated'] = false;
        serializer.init({
            typeProperty: '@type'
        });
        
        expect(serializer['_typeProperty']).to.be.equal('@type');
    });
    
    it('should not be able to init twice', () => {
        serializer['_initiated'] = false;
        serializer.init();
        
        expect(() => serializer.init()).to.throw();
    });
    
    it('should properly return type name', () => {
        expect(serializer.getTypeName(Foo)).to.be.equal('sample');
    });
    
    it('should properly return type by name', () => {
        expect(serializer.getTypeByName('sample')).to.be.equal(Foo);
    });
    
    it('should throw for unknown type', () => {
        class Foo2 {}
        
        expect(() => serializer.getTypeName(Foo2)).to.throw();
    });
    
    it('should throw for unknown type name', () => {
        expect(() => serializer.getTypeByName('foooooo2')).to.throw();
    });
});
