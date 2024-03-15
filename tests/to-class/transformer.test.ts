import { registerSerializerTests } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

registerSerializerTests('ToPlain / Transformers', () => {
    @Srlz.Type('cchild')
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
    
    @Srlz.Type('centity')
    class Entity
    {
        
        @Srlz.Id()
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
        const plain = {
            [TypeProp]: 'centity',
            id: 1,
            name: 'Noname',
            createdAt: '2024-03-10T00:50:30.201Z',
            child: 'text',
            perPropTrans: 'text',
        };
        
        const object = serializer.toClass(plain, {
            type: Entity
        });
        
        expect(object).to.deep.equal({
            id: 1,
            name: 'Noname',
            createdAt: new Date('2024-03-10T00:50:30.201Z'),
            child: new Child('TEXT'),
            perPropTrans: 'TEXT',
        });
    });
    
    it('should properly expose accessors', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            public internal : number = 5;
            
            @Srlz.Expose()
            @Srlz.Exclude()
            public set computed (v : number)
            {
                this.internal = v * 2;
            }
        }
        
        const plain = {
            id: 2,
            computed: 6,
            internal: 13,
        };
        
        const object = serializer.toClass(plain, {
            type: Entity
        });
        
        expect(object).to.deep.equal({
            id: 2,
            internal: 12,
        });
    });
    
    it('should properly handle non-writable accessors', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            public get computed ()
            {
                return 'computed';
            }
        }
        
        const plain = {
            id: 2,
            computed: 6,
        };
        
        const object = serializer.toClass(plain, {
            type: Entity
        });
        
        expect(object).to.deep.equal({
            id: 2
        });
    });
    
    it('should properly execute per property transformer', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            @Srlz.Transformer({
                toClass: source => {
                    return [ source * 2, true ];
                }
            })
            public value : number = 5;
        }
        
        const plain = {
            id: 2,
            value: 10
        };
        
        const object = serializer.toClass(plain, {
            type: Entity
        });
        
        expect(object).to.deep.equal({
            id: 2,
            value: 20,
        });
    });
});
