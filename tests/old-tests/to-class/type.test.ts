import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('To Class / Type', () => {
    class Item
    {
        @Srlz.Expose()
        public id = 3;
    }
    
    class User
    {
        @Srlz.Expose()
        public id = 2;
        
        @Srlz.Expose()
        @Srlz.Type(() => Item)
        public item : Item;
    }
    
    class Player
        extends User
    {
        @Srlz.Expose()
        public name = null;
    }
    
    it('Type case', () => {
        const plain : Partial<Player> = {
            id: 3,
            item: { id: 4 },
            name: 'foo',
        };
        
        const obj = serializer.toClass(plain, { type: Player });
        
        expect(obj)
            .instanceof(Player)
            .to.containSubset({
            id: 3,
            name: 'foo',
        })
        ;
        
        expect(obj.item)
            .instanceof(Item)
            .to.eql({
            id: 4,
        })
        ;
    });
    
    it('Wrong type data', () => {
        const plain : any = {
            id: 3,
            item: [ { id: 4 } ],
            name: 'foo',
        };
        
        const obj = serializer.toClass(plain, { type: Player });
        
        expect(obj)
            .instanceof(Player)
            .to.containSubset({
            id: 3,
            name: 'foo',
        })
        ;
        
        expect(obj.item)
            .instanceof(Item)
            .to.eql({
            id: 3,
        })
        ;
    });
    
    it('Array case', () => {
        class ExPlayer
            extends Player
        {
            @Srlz.Expose()
            @Srlz.Type({ arrayOf: () => Item })
            public items = [
                new Item()
            ];
        }
        
        
        const plain : Partial<ExPlayer> = {
            id: 3,
            items: [ { id: 4 } ],
            name: 'foo',
        };
        
        const obj = serializer.toClass(plain, { type: ExPlayer });
        
        expect(obj)
            .instanceof(ExPlayer)
            .to.containSubset({
            id: 3,
            name: 'foo',
        })
        ;
        
        for (const i in obj.items) {
            expect(obj.items[i])
                .instanceof(Item)
            ;
        }
        
        expect(obj.items)
            .to.eql([
            { id: 4, }
        ])
        ;
    });
    
    it('Records case', () => {
        class ExPlayer
            extends Player
        {
            @Srlz.Expose()
            @Srlz.Type({ recordOf: () => Item })
            public items : Record<string, Item> = {
                bar: new Item()
            };
        }
        
        
        const plain : Partial<ExPlayer> = {
            id: 3,
            items: {
                nice: { id: 4 },
            },
            name: 'foo',
        };
        
        const obj = serializer.toClass(plain, { type: ExPlayer });
        
        expect(obj)
            .instanceof(ExPlayer)
            .to.containSubset({
            id: 3,
            name: 'foo',
        })
        ;
        
        for (const i in obj.items) {
            expect(obj.items[i])
                .instanceof(Item)
            ;
        }
        
        expect(obj.items)
            .to.eql({
            nice: { id: 4, }
        })
        ;
    });
    
    it('Already in proper type (deeply toClass)', () => {
        class ExPlayer
            extends Player
        {
            @Srlz.Expose()
            @Srlz.Type({ recordOf: () => Item })
            public items : Record<string, Item> = {
                bar: new Item()
            };
        }
        
        
        const sourceObj = new ExPlayer();
        sourceObj.id = 3;
        sourceObj.items = {
            nice: { id: 4 }
        };
        sourceObj.name = 'foo';
        
        const obj = serializer.toClass(sourceObj, { type: ExPlayer });
        
        expect(obj)
            .instanceof(ExPlayer)
            .to.containSubset({
            id: 3,
            name: 'foo',
        })
        ;
        
        expect(obj.items.nice)
            .instanceof(Item)
        ;
        
        expect(obj.items)
            .to.eql({
            nice: { id: 4, }
        })
        ;
    });
    
    it('Deeply', () => {
        class ExItem
        {
            @Srlz.Expose()
            public id = 3;
            
            @Srlz.Expose()
            @Srlz.Type(() => ExItem)
            public child? : ExItem = null;
        }
        
        class ExPlayer
            extends Player
        {
            @Srlz.Expose()
            @Srlz.Type(() => ExItem)
            public item : ExItem = null;
        }
        
        const deepItem = new ExItem();
        deepItem.id = 6;
        deepItem.child = { id: 7 };
        
        const sourceObj = new ExPlayer();
        sourceObj.id = 3;
        sourceObj.item = {
            id: 4,
            child: {
                id: 5,
                child: deepItem
            }
        };
        sourceObj.name = 'foo';
        
        const obj = serializer.toClass(sourceObj, { type: ExPlayer });
        
        expect(obj.item)
            .instanceof(ExItem)
            .to.containSubset({
            id: 4,
            child: {}
        })
        ;
        
        expect(obj.item.child)
            .instanceof(ExItem)
            .to.containSubset({
            id: 5,
            child: {}
        })
        ;
        
        expect(obj.item.child.child)
            .instanceof(ExItem)
            .to.containSubset({
            id: 6,
            child: {}
        })
        ;
        expect(obj.item.child.child === deepItem).to.be.true;
        
        expect(deepItem.child)
            .instanceof(ExItem)
            .to.containSubset({
            id: 7,
            child: null
        })
        ;
    });
    
});
