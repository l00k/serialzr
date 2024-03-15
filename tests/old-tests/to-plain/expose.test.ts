import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz, Strategy } from '$/index.js';


prepareSerializerContext('To Plain / Expose', () => {
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
        
        @Srlz.Expose({ deeply: true })
        public publicData : any;
    }
    
    it('Built in types', () => {
        const obj = serializer.toPlain(new Boolean(true));
        expect(obj == true).to.eq(true);
    });
    
    it('Simple case', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.be.eql({
            id: 2,
            name: 'foo',
        });
    });
    
    it('Partial case', () => {
        const object : Player = new Player();
        object.name = undefined;
        (<any>object).external = 3;
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.eql({
            id: 2,
        });
    });
    
    it('Using specific group', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.toPlain(
            object,
            { groups: [ 'adminOnly' ] }
        );
        
        expect(plain).to.eql({
            id: 2,
            name: 'foo',
            adnotations: 'unchanged'
        });
    });
    
    it('Should allow non explictly props if strategy set to expose', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.toPlain(
            object,
            { strategy: Strategy.Expose }
        );
        
        expect(plain).to.eql({
            id: 2,
            secret: 'unchanged',
            name: 'foo',
            adnotations: 'unchanged'
        });
    });
    
    it('Should exclude prefixes', () => {
        class User
        {
            @Srlz.Expose()
            public id = 2;
            
            public __internal : string = 'internal';
        }
        
        
        const object : User = new User();
        object.id = 3;
        
        const plain = serializer.toPlain(
            object,
            { strategy: Strategy.Expose, excludePrefixes: [ '__' ] }
        );
        
        expect(plain).to.eql({
            id: 3,
        });
    });
    
    it('Should deeply expose data if modificator used', () => {
        const object : Player = new Player();
        object.name = 'foo';
        object.publicData = { deep: { deep: { value: 1 } } };
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.eql({
            id: 2,
            name: 'foo',
            publicData: { deep: { deep: { value: 1 } } }
        });
    });
    
    
    it('Should catch circular dependencies', () => {
        class Worker extends User
        {
            
            @Srlz.Expose()
            public child1 : Worker;
            
            @Srlz.Expose()
            public child2 : Worker;
        }
        
        const object : Worker = new Worker();
        object.child1 = new Worker();
        object.child2 = object;
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.eql({
            id: 2,
            child1: { id: 2 },
        });
    });
    
    it('Should limit depth', () => {
        class Worker extends User
        {
            @Srlz.Expose()
            public child : Worker;
        }
        
        const object : Worker = new Worker();
        object.child = new Worker();
        object.child.child = new Worker();
        object.child.child.child = new Worker();
        
        const plain = serializer.toPlain(object, { depth: 2 });
        
        expect(plain).to.eql({
            id: 2,
            child: {},
        });
    });
    
});
