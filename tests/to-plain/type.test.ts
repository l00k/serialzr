import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('ToPlain / Type', () => {
    class Item
    {
        @Srlz.Expose()
        public id = 3;
    }
    
    it('Wrong type', () => {
        const obj = serializer.toPlain([ true ], {
            type: { arrayOf: () => Item }
        });
        
        expect(obj).to.deep.equal([]);
    });
});
