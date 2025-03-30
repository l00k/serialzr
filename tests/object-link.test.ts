import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('ToPlain / Object Link', () => {
    @Srlz.Type('Sample134')
    class Item
    {
        @Srlz.Id(() => Number)
        public id : number = 3;
    }
    
    beforeEach(() => {
        serializer['_initiated'] = false;
        serializer.init({
            useObjectLink: true,
        });
    });
    
    it('Should be able to build object link', () => {
        const objectLink = serializer.buildObjectLink(
            new Item(),
        );
        
        expect(objectLink).to.equal('@/Sample134/3');
    });
    
    it('Should be able to parse object link', () => {
        const parsedObjectLink = serializer.parseObjectLink('@/Sample134/3');
        
        expect(parsedObjectLink).to.deep.equal({
            type: Item,
            id: 3,
        });
    });
});
