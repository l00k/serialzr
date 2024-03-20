import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz, Strategy } from '$/index.js';


prepareSerializerContext('To Class / Exposing', () => {
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
        
        @Srlz.Exclude([ 'withoutDetails' ]) // exclude on group
        @Srlz.Expose() // expose by default
        public description = 'unchanged';
        
        @Srlz.Expose([ 'adminOnly' ])
        public adnotations = 'unchanged';
    }
    
    
    it('Full data case', () => {
        const plain : any = {
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'Nice guy',
        };
        
        const obj = serializer.toClass(plain, { type: Player });
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 3,
            secret: 'unchanged',
            secret2: undefined,
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'unchanged',
        });
    });
    
    it('With extra non specified properties', () => {
        const plain : any = {
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            name: 'foo',
            adnotations: 'Nice guy',
            description: 'bbbbb',
            hacker: 'Im here',
        };
        
        const obj = serializer.toClass(plain, { type: Player });
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 3,
            secret: 'unchanged',
            secret2: undefined,
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'unchanged',
        });
    });
    
    it('Partial case', () => {
        const plain : Partial<Player> = {
            secret: 'hacker',
            secret2: 'hacker',
            adnotations: 'Nice guy',
        };
        
        const obj = serializer.toClass(plain, { type: Player });
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 2,
            secret: 'unchanged',
            secret2: undefined,
            name: null,
            description: 'unchanged',
            adnotations: 'unchanged',
        });
    });
    
    it('Using specific group to expose', () => {
        const plain : Partial<Player> = {
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'Nice guy',
        };
        
        const obj = serializer.toClass(
            plain,
            { type: Player, groups: [ 'adminOnly' ] }
        );
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 3,
            secret: 'unchanged',
            secret2: undefined,
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'Nice guy',
        })
        ;
    });
    
    it('Using specific group to exclude', () => {
        const plain : Partial<Player> = {
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            name: 'foo',
            description: 'bbbbb',
            adnotations: 'Nice guy',
        };
        
        const obj = serializer.toClass(
            plain,
            { type: Player, groups: [ 'withoutDetails' ] }
        );
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 3,
            secret: 'unchanged',
            secret2: undefined,
            name: 'foo',
            description: 'unchanged',
            adnotations: 'unchanged',
        })
        ;
    });
    
    it('Should allow non explictly exposed props if strategy set to expose', () => {
        const plain : Partial<Player> = {
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            adnotations: 'Nice guy',
        };
        
        const obj = serializer.toClass(
            plain,
            {
                type: Player,
                defaultStrategy: Strategy.Expose
            }
        );
        
        expect(obj).instanceof(Player);
        expect(obj).to.eql({
            id: 3,
            secret: 'hacker',
            secret2: 'hacker',
            name: null,
            description: 'unchanged',
            adnotations: 'Nice guy',
        })
        ;
    });
    
    it('Should exclude prefixes', () => {
        class User
        {
            @Srlz.Expose()
            public id = 2;
            
            public __internal : string = 'internal';
        }
        
        
        const plain : Partial<User> = {
            id: 3,
            __internal: 'hacker',
        };
        
        const obj = serializer.toClass(
            plain,
            { type: User, defaultStrategy: Strategy.Expose, excludePrefixes: [ '__' ] }
        );
        
        expect(obj).instanceof(User);
        expect(obj).to.eql({
            id: 3,
            __internal: 'internal',
        });
    });
});
