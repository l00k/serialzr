import { prepareSerializerContext } from '#/test-helper.js';
import { Srlz, serializer } from '$/index.js';


prepareSerializerContext('Basics', () => {
    @Srlz.Type('sample')
    class Foo {}
    
    it('should assign config based on passed options', () => {
        serializer['_initiated'] = false;
        serializer.init({
            typeProperty: '@typee',
            objectLinkProperty: '@idd',
            useObjectLink: true,
        });
        
        expect(serializer['_typeProperty']).to.be.equal('@typee');
        expect(serializer['_objectLinkProperty']).to.be.equal('@idd');
        expect(serializer['_useObjectLink']).to.be.equal(true);
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
