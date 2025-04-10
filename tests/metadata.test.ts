import { prepareSerializerContext } from '#/test-helper.js';
import { Registry, Srlz } from '$/index.js';


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
        public annotations = 'unchanged';
        
        public get getAccessor () : number { return 2; }
        
        public set setAccessor (value : number) {}
        
        public propFunc = function () : void {}
        
        public method () : void {}
    }
    
    class Admin extends Player {}
    
    const registry = Registry.getSingleton();
    
    
    it('should not be possible to register second type with the same name', () => {
        registry.registerType(
            User,
            { name: 'User' },
        );
        
        expect(() => {
            registry.registerType(
                Player,
                { name: 'User' },
            );
        }).to.throw();
    });
    
    it('should properly return list of properties', () => {
        const properties = registry.getAllProperties(Player);
        
        expect(Array.from(properties)).to.be.eql([
            'id',
            'name',
            'annotations',
            'secret',
            'secret2',
            'propFunc',
        ]);
    });
    
    it('should return proper property definition for child class', () => {
        const idPropDef = registry.getPropertyDefinition(
            Admin,
            'id',
        );
        
        expect(idPropDef).to.be.eql({
            descriptor: {
                configurable: true,
                enumerable: true,
                value: 2,
                writable: true,
            },
            exposeRules: [
                { expose: true },
            ],
            modifiers: {},
            typeDscr: undefined,
        });
    });
    
    it('should return proper properties list for child class', () => {
        const properties = registry.getAllProperties(Admin);
        
        expect(Array.from(properties)).to.be.eql([
            'id',
            'name',
            'annotations',
            'secret',
            'secret2',
            'propFunc',
        ]);
    });
    
    it('should update cache on metadata cache', () => {
        registry.getAllProperties(Player);
        
        Srlz.Expose()(Player.prototype, 'foo');
        
        const properties = registry.getAllProperties(Player);
        
        expect(Array.from(properties)).to.be.eql([
            'id',
            'name',
            'annotations',
            'secret',
            'secret2',
            'propFunc',
            'foo',
        ]);
    });
});
