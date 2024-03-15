import { registerSerializerTests } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


registerSerializerTests('Clone', () => {
    @Srlz.Type()
    class Player
    {
        @Srlz.Id()
        public id = 3;
        
        @Srlz.Expose()
        public name = null;
    }
    
    @Srlz.Type()
    class Item
    {
        @Srlz.Id()
        public id = 2;
    }
    
    @Srlz.Type()
    class User
    {
        @Srlz.Id()
        public id = 2;
        
        @Srlz.Expose()
        @Srlz.Type(() => Player)
        public player : Player;
        
        @Srlz.Expose()
        @Srlz.Type({ arrayOf: () => Item })
        public items : Item[] = [];
    }
    
    it('Should remove all references', () => {
        const source : User = new User();
        source.id = 3;
        source.player = new Player();
        source.player.id = 4;
        source.player.name = 'sample';
        source.items.push(
            ...[ 5, 6 ].map(id => {
                const item = new Item();
                item.id = id;
                return item;
            })
        );
        
        const clone = serializer.clone(source);
        
        expect(clone).to.be.instanceof(User);
        expect(clone.player).to.be.instanceof(Player);
        expect(clone.items[0]).to.be.instanceof(Item);
        expect(clone).to.eql({
            id: 3,
            player: {
                id: 4,
                name: 'sample'
            },
            items: [
                { id: 5 },
                { id: 6 },
            ]
        });
        
        expect(clone !== source).to.be.eq(true);
        expect(clone.player !== source.player).to.be.eq(true);
        expect(clone.items !== source.items).to.be.eq(true);
        expect(clone.items[0] !== source.items[0]).to.be.eq(true);
    });
});
