import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('To Plain / Expose', () => {
    @Srlz.Type()
    class User
    {
        @Srlz.Id()
        public id = 2;
        
        @Srlz.Expose()
        public name = null;
        
        @Srlz.Expose()
        public get sample () : number
        {
            return 3;
        }
    }
    
    @Srlz.Type()
    class Player
        extends User
    {
        public secret = 'unchanged';
        public secret2 = undefined;
        
        @Srlz.Expose([ 'adminOnly' ])
        public annotations = 'unchanged';
        
        @Srlz.Expose({ forceExpose: true })
        public publicData : any;
    }
    
    it('Built in types', () => {
        const obj = serializer.serialize(new Boolean(true));
        expect(obj == true).to.eq(true);
    });
    
    it('Simple case', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.be.eql({
            '@type': 'User/Player',
            id: 2,
            name: 'foo',
            sample: 3,
        });
    });
    
    it('Partial case', () => {
        const object : Player = new Player();
        object.name = undefined;
        (<any>object).external = 3;
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.eql({
            '@type': 'User/Player',
            id: 2,
            sample: 3,
        });
    });
    
    it('Using specific group', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.serialize(
            object,
            { groups: [ 'adminOnly' ] },
        );
        
        expect(plain).to.eql({
            '@type': 'User/Player',
            id: 2,
            name: 'foo',
            sample: 3,
            annotations: 'unchanged',
        });
    });
    
    it('Should allow non explictly props if strategy set to expose', () => {
        const object : Player = new Player();
        object.name = 'foo';
        (<any>object).external = 3;
        
        const plain = serializer.serialize(
            object,
            { defaultStrategy: true },
        );
        
        expect(plain).to.eql({
            '@type': 'User/Player',
            id: 2,
            secret: 'unchanged',
            name: 'foo',
            sample: 3,
            annotations: 'unchanged',
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
        
        const plain = serializer.serialize(
            object,
            { defaultStrategy: true, excludePrefixes: [ '__' ] },
        );
        
        expect(plain).to.eql({
            id: 3,
        });
    });
    
    it('Should deeply expose data if modificator used', () => {
        const object : Player = new Player();
        object.name = 'foo';
        object.publicData = { deep: { deep: { value: 1 } } };
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.eql({
            '@type': 'User/Player',
            id: 2,
            name: 'foo',
            publicData: { deep: { deep: { value: 1 } } },
            sample: 3,
        });
    });
    
    
    it('Should catch circular dependencies', () => {
        @Srlz.Type()
        class Worker extends User
        {
            
            @Srlz.Expose()
            public child1 : Worker;
            
            @Srlz.Expose()
            public child2 : Worker;
        }
        
        const object : Worker = new Worker();
        object.name = 'test';
        object.child1 = new Worker();
        object.child1.id = 3;
        object.child1.name = 'sample';
        object.child2 = object;
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.eql({
            '@type': 'User/Worker',
            id: 2,
            name: 'test',
            child1: {
                '@type': 'User/Worker',
                id: 3,
                name: 'sample',
                sample: 3,
            },
            child2: {
                '@type': 'User/Worker',
                id: 2,
            },
            sample: 3,
        });
    });
    
    it('Should catch circular dependencies with object link', () => {
        serializer['_useObjectLink'] = true;
        
        @Srlz.Type()
        class WorkerB extends User
        {
            
            @Srlz.Expose()
            public child1 : WorkerB;
            
            @Srlz.Expose()
            public child2 : WorkerB;
        }
        
        const object : WorkerB = new WorkerB();
        object.name = 'test';
        object.child1 = new WorkerB();
        object.child1.id = 3;
        object.child1.name = 'sample';
        object.child2 = object;
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.eql({
            '@type': 'User/WorkerB',
            '@id': '@/User/WorkerB/2',
            id: 2,
            name: 'test',
            child1: {
                '@type': 'User/WorkerB',
                '@id': '@/User/WorkerB/3',
                id: 3,
                name: 'sample',
                sample: 3,
            },
            child2: '@/User/WorkerB/2',
            sample: 3,
        });
    });
    
    it('Should limit depth', () => {
        class Worker extends User
        {
            @Srlz.Expose()
            public child : Worker;
        }
        
        const object : Worker = new Worker();
        object.name = 'test1';
        object.child = new Worker();
        object.child.name = 'test2';
        object.child.child = new Worker();
        object.child.child.name = 'test3';
        object.child.child.child = new Worker();
        object.child.child.child.name = 'test4';
        
        const plain = serializer.serialize(object, { maxDepth: 2 });
        
        expect(plain).to.deep.equal({
            id: 2,
            name: 'test1',
            child: {
                id: 2,
                name: 'test2',
                child: {},
                sample: 3,
            },
            sample: 3,
        });
    });
    
});
