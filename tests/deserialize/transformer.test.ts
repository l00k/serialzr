import { prepareSerializerContext } from '#/test-helper.js';
import type { SerializationOptions , SerializationContext } from '$/index.js';
import { BaseTransformer, serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Deserialize / Transformers', () => {
    @Srlz.RegisterTransformer()
    class ChildTransformer extends BaseTransformer
    {
        
        public readonly serializeOrder : number = -100;
        public readonly deserializeOrder : number = -100;
        
        public preflight (
            input : any,
            context : SerializationContext.Base<any>,
            options : SerializationOptions.Base<any>,
        ) : boolean
        {
            return context.propertyKey === 'child';
        }
        
        public serialize (
            input : any,
            context : SerializationContext.Serialize,
            options : SerializationOptions.Serialize,
        ) : any
        {
            context.stopProcessing = true;
            return input.value.toLowerCase();
        }
        
        public deserialize (
            input : any,
            context : SerializationContext.Deserialize,
            options : SerializationOptions.Deserialize,
        ) : any
        {
            context.stopProcessing = true;
            return new Child(input.toUpperCase());
        }
    }
    
    @Srlz.Type('cchild')
    class Child
    {
    
        @Srlz.Expose()
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
        
        @Srlz.Type(() => Child)
        @Srlz.Expose()
        @Srlz.Transformer.Deserialize({
            after: source => ({ output: new Child(source.value.toUpperCase() + '!'), final: true }),
        })
        public child2 : Child = new Child('TEXT2');
        
        @Srlz.Expose()
        @Srlz.Transformer({
            deserialize: (source) => {
                return { output: source.toUpperCase(), final: true };
            },
        })
        public perPropTrans : string = 'TEXT';
        
    }
    
    
    it('properly transform', () => {
        const plain = {
            [TypeProp]: 'centity',
            id: 1,
            name: 'Noname',
            createdAt: '2024-03-10T00:50:30.201Z',
            child: 'text',
            child2: { value: 'text2' },
            perPropTrans: 'text',
        };
        
        const object = serializer.deserialize(plain, {
            type: Entity,
        });
        
        expect(object).to.deep.equal({
            id: 1,
            name: 'Noname',
            createdAt: new Date('2024-03-10T00:50:30.201Z'),
            child: new Child('TEXT'),
            child2: new Child('TEXT2!'),
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
        
        const object = serializer.deserialize(plain, {
            type: Entity,
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
            public get computed () : string
            {
                return 'computed';
            }
        }
        
        const plain = {
            id: 2,
            computed: 6,
        };
        
        const object = serializer.deserialize(plain, {
            type: Entity,
        });
        
        expect(object).to.deep.equal({
            id: 2,
        });
    });
    
    it('should properly execute per property transformer', () => {
        class Entity
        {
            @Srlz.Expose()
            public id : number = 1;
            
            @Srlz.Expose()
            @Srlz.Transformer.Deserialize({ before: (source : any) => ({ output: source * 2, final: true }) })
            public value : number = 5;
        }
        
        const plain = {
            id: 2,
            value: 10,
        };
        
        const object = serializer.deserialize(plain, {
            type: Entity,
        });
        
        expect(object).to.deep.equal({
            id: 2,
            value: 20,
        });
    })
    ;
});
