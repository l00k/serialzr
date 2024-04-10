import { prepareSerializerContext } from '#/test-helper.js';
import { MetadataStorage, Srlz } from '$/index.js';


prepareSerializerContext('Metadata', () => {
    class User
    {
        @Srlz.Expose()
        public id = 2;
    }
    
    class Player
        extends User
    {
        public secret = 'unchanged';
        public secret2 = undefined;
        
        @Srlz.Expose()
        public name = null;
        
        @Srlz.Expose([ 'adminOnly' ])
        @Srlz.Modifiers({ objectMerge: true })
        public adnotations = 'unchanged';
        
        public get getAccessor () { return 2; }
        
        public set setAccessor (value : number) {}
        
        public propFunc = function () {}
        
        public method () {}
    }
    
    class Admin extends Player {}
    
    const metadataStorage = MetadataStorage.getSingleton();
    
    
    it('should not be possible to register second type with the same name', () => {
        metadataStorage.registerType(
            User,
            { name: 'User' }
        );
        
        expect(() => {
            metadataStorage.registerType(
                Player,
                { name: 'User' }
            );
        }).to.throw();
    });
    
    it('should properly return list of properties', () => {
        const properties = metadataStorage.getAllProperties(Player);
        
        expect(Array.from(properties)).to.be.eql([
            'name',
            'adnotations',
            'getAccessor',
            'setAccessor',
            'id',
            'secret',
            'secret2',
            'propFunc',
        ]);
    });
    
    it('should return proper property definition for child class', () => {
        const idPropDef = metadataStorage.getPropertyDefinition(
            Admin,
            'id'
        );
        
        expect(idPropDef).to.be.eql({
            descriptor: {
                configurable: true,
                enumerable: true,
                value: 2,
                writable: true,
            },
            exposeDscrs: [
                { mode: true },
            ],
            modifiers: {},
            transformers: {},
            type: undefined,
        });
    });
    
    it('should return proper properties list for child class', () => {
        const properties = metadataStorage.getAllProperties(Admin);
        
        expect(Array.from(properties)).to.be.eql([
            'id',
            'secret',
            'secret2',
            'name',
            'adnotations',
            'propFunc',
            'getAccessor',
            'setAccessor',
        ]);
    });
    
    it('should update cache on metadata cache', () => {
        metadataStorage.getAllProperties(Player);
        
        Srlz.Expose()(Player.prototype, 'foo');
        
        const properties = metadataStorage.getAllProperties(Player);
        
        expect(Array.from(properties)).to.be.eql([
            'name',
            'adnotations',
            'getAccessor',
            'setAccessor',
            'id',
            'secret',
            'secret2',
            'propFunc',
            'foo',
        ]);
    });
});
