import { prepareSerializerContext } from '#/test-helper.js';
import { serializer } from '$/index.js';


prepareSerializerContext('Basics', () => {
    after(() => {
        serializer['_initiated'] = false;
        serializer.init();
    });
    
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
});
