import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('ToPlain / Object Link', () => {
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
        const obj = new Parent();
        (obj as any).child = 5;
    
        const plain = serializer.toPlain(obj);
        
        expect(plain).to.deep.equal({
            '@type': 'Sample136',
            '@id': '@/Sample136/4',
            id: 4,
            child: '@/Sample135/5',
        });
    });
});
