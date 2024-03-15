import { prepareSerializerContext } from '#/test-helper.js';
import { Exception, getClassesFromChain } from '$/helpers/index.js';


prepareSerializerContext('Helpers / getClassesFromChain', () => {
    class Base {}
    
    class Child extends Base {}
    
    class GrandChild extends Child {}
    
    it('should return empty array for wrong params', () => {
        expect(getClassesFromChain(null))
            .to.be.deep.equal([]);
    });
    
    it('should throw error for wrong params', () => {
        expect(() => getClassesFromChain(<any>1))
            .to.throw(Exception, 'Argument is not a function');
    });
    
    it('should return class itself', () => {
        expect(getClassesFromChain(Base))
            .to.be.deep.equal([ Base ]);
    });
    
    it('should return all base clasess and class itself class', () => {
        expect(getClassesFromChain(GrandChild))
            .to.be.deep.equal([ GrandChild, Child, Base ]);
    });
    
});
