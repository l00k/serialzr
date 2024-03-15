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
        public adnotations = 'unchanged';
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
            'id',
            'secret',
            'secret2',
            'name',
            'adnotations',
        ]);
    });
    
    it('should return proper property definition for child class', () => {
        const idPropDef = metadataStorage.getPropertyDefinition(
            Admin,
            'id'
        );
        
        expect(idPropDef).to.be.eql({
            exposeDscrs: [
                { mode: true },
            ],
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
        ]);
    });
    
    it('should update cache on metadata cache', () => {
        metadataStorage.getAllProperties(Player);
        
        Srlz.Expose()(Player.prototype, 'foo');
        
        const properties = metadataStorage.getAllProperties(Player);
        
        expect(Array.from(properties)).to.be.eql([
            'id',
            'secret',
            'secret2',
            'name',
            'adnotations',
            'foo',
        ]);
    });
});
