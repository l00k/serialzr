import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToPlain / Transformers', () => {
    @Srlz.Type('#child')
    @Srlz.Transformer<Child>({
        toClass: (source) => {
            return [ new Child(source.toUpperCase()), true ];
        },
        toPlain: (source) => {
            return [ source.value.toLowerCase(), true ];
        }
    })
    class Child
    {
        public value : string = '';
        public constructor (value : string)
        {
            this.value = value;
        }
    }
    
    @Srlz.Type({
        name: '#entity',
        idProperty: 'id',
    })
    class Entity
    {
        
        @Srlz.Expose()
        public id : number = 1;
        
        @Srlz.Expose()
        public name : string = 'Noname';
        
        @Srlz.Type(() => Date)
        @Srlz.Expose()
        public createdAt : Date = new Date(1710031830201);
        
        @Srlz.Type(() => Child)
        @Srlz.Expose()
        public child : Child = new Child('TEXT');
        
        @Srlz.Expose()
        @Srlz.Transformer<string>({
            toPlain: (source) => {
                return [ source.toLowerCase(), true ];
            },
            toClass: (source) => {
                return [ source.toUpperCase(), true ];
            },
        })
        public perPropTrans : string = 'TEXT';
        
    }
    
    it('properly transformate', () => {
        const object = new Entity();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: '#entity',
            id: 1,
            name: 'Noname',
            createdAt: '2024-03-10T00:50:30.201Z',
            child: 'text',
            perPropTrans: 'text',
        });
    });
    
    it('should properly expose accessors', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            public get computed () : string
            {
                return 'computed';
            }
        }
        
        const object = new Entity();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            id: 1,
            computed: 'computed',
        });
    });
    
    it('should properly handle non-readable accessors', () => {
        class Entity
        {
            @Srlz.Id()
            public get id () : number
            {
                return 1;
            }
            
            @Srlz.Expose()
            public set computed (a : any)
            {}
        }
        
        const object = new Entity();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            id: 1
        });
    });
    
    it('should properly execute per property transformer', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Type(() => Number)
            @Srlz.Expose()
            @Srlz.Transformer({
                toPlain: source => [ source * 2, true ]
            })
            public get computed () : number
            {
                return this.id;
            }
        }
        
        const object = new Entity();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            id: 1,
            computed: 2,
        });
    });
    
    it('should properly handle computed values', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            @Srlz.Computed(({ parent }) => parent.id * 2)
            public computed : number;
            
        }
        
        const object = new Entity();
        
        expect(serializer.toPlain(object)).to.deep.equal({
            id: 1,
            computed: 2,
        });
        
        object.computed = 5;
        
        expect(serializer.toPlain(object)).to.deep.equal({
            id: 1,
            computed: 5,
        });
    });
    
    it('should properly handle computedByGroup values', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            @Srlz.ComputedByGroups([ 'group1' ])
            public computed : boolean;
            
        }
        
        const object = new Entity();
        
        expect(
            serializer.toPlain(object, { groups: [ 'group1' ] })
        ).to.deep.equal({
            id: 1,
            computed: true,
        });
        
        expect(
            serializer.toPlain(object)
        ).to.deep.equal({
            id: 1,
            computed: false,
        });
        
        object.computed = null;
        
        expect(
            serializer.toPlain(object)
        ).to.deep.equal({
            id: 1,
            computed: null,
        });
    });
});
