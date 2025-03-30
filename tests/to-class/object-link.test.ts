import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('ToClass / Object Link', () => {
    @Srlz.Type('Sample135')
    class Item
    {
        @Srlz.Id(() => Number)
        public id : number = 3;
    }
    
    @Srlz.Type('Sample136')
    class Parent
    {
        @Srlz.Id(() => Number)
        public id : number = 4;
        
        @Srlz.Expose()
        @Srlz.Type(() => Item)
        public child : Item = new Item();
    }
    
    beforeEach(() => {
        serializer['_initiated'] = false;
        serializer.init({
            useObjectLink: true,
        });
    });
    
    it('Should be able to build object link in childs', () => {
        const obj = serializer.toClass({
            '@type': 'Sample136',
            '@id': '@/Sample136/5',
            id: 5,
            child: '@/Sample135/6',
        }, { type: Parent });
        
        expect(obj).instanceof(Parent);
        expect(obj).to.deep.equal({
            id: 5,
            child: {
                id: 6,
            }
        });
        expect(obj.child).instanceof(Item);
    });
});
