import { prepareSerializerContext } from '#/test-helper.js';
import type { ObjectLinkProcessor } from '$/index.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('ObjectLinkProcessor', () => {
    @Srlz.Type('Sample134')
    class Item
    {
        @Srlz.Id(() => Number)
        public id : number = 3;
    }
    
    @Srlz.Type('Sample132')
    class ItemA
    {
        public id : number = 3;
    }
    
    @Srlz.Type('Sample138')
    class ItemB
    {
        @Srlz.Id(() => String)
        public id : string = '3';
    }
    
    @Srlz.Type('Sample139')
    class ItemC
    {
        @Srlz.Id()
        public id : any = { id: 2 };
    }
    
    let objectLinkProcessor : ObjectLinkProcessor;
    
    beforeEach(() => {
        serializer['_initiated'] = false;
        serializer.init({
            useObjectLink: true,
        });
        objectLinkProcessor = serializer.getObjectLinkProcessor();
    });
    
    it('Should be able to build object link', () => {
        const objectLink = objectLinkProcessor.build(
            new Item(),
        );
        
        expect(objectLink).to.equal('@/Sample134/3');
    });
    
    it('Should allow building object link with blank id', () => {
        const item = new Item();
        item.id = undefined;
        
        const objectLink = objectLinkProcessor.build(item);
        expect(objectLink).to.equal(undefined);
    });
    
    it('Should throw in case of building from unknown type', () => {
        const item = { id: undefined };
        
        expect(
            () => objectLinkProcessor.build(item),
        ).to.throw('1744044581375');
    });
    
    it('Should throw in case of building with unknown id', () => {
        const item = new Item();
        item.id = undefined;
        
        expect(
            () => objectLinkProcessor.build(item, false),
        ).to.throw('1743360679287');
    });
    
    it('Should be able to parse object link', () => {
        const parsedObjectLink = objectLinkProcessor.parse('@/Sample134/3');
        
        expect(parsedObjectLink).to.deep.equal({
            type: Item,
            id: 3,
        });
    });
    
    it('Should throw in case of wrong object link format', () => {
        expect(
            () => objectLinkProcessor.parse('#/Sample134/3'),
        ).to.throw('1743360099255');
    });
    
    it('Should throw in case of unknwon type', () => {
        expect(
            () => objectLinkProcessor.parse('@/Sample135/3'),
        ).to.throw('1743360231473');
    });
    
    it('Should throw in case of type without id specified', () => {
        expect(
            () => objectLinkProcessor.parse('@/Sample132/3'),
        ).to.throw('1743360388303');
    });
    
    it('Should be able to parse object link with string id', () => {
        const parsedObjectLink = objectLinkProcessor.parse('@/Sample138/abcdef');
        
        expect(parsedObjectLink).to.deep.equal({
            type: ItemB,
            id: 'abcdef',
        });
    });
    
    it('Should be able to parse object link with string id', () => {
        const parsedObjectLink = objectLinkProcessor.parse('@/Sample139/abcdef');
        
        expect(parsedObjectLink).to.deep.equal({
            type: ItemC,
            id: 'abcdef',
        });
    });
});
