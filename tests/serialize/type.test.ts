import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('Serialize / Type', () => {
    class Item
    {
        @Srlz.Expose()
        public id = 3;
    }
    
    it('Wrong type', () => {
        const obj = serializer.serialize([ true ], {
            typeDscr: { arrayOf: () => Item },
        });
        
        expect(obj).to.deep.equal([]);
    });
});
