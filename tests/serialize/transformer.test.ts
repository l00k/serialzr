import { prepareSerializerContext } from '#/test-helper.js';
import type { SerializationContext } from '$/index.js';
import { BaseTransformer, serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Serialize / Transformers', () => {
    @Srlz.RegisterTransformer()
    class ChildTransformer extends BaseTransformer
    {
        
        public readonly serializeOrder : number = -100;
        public readonly deserializeOrder : number = -100;
        
        public preflight (
            input : any,
            context : SerializationContext.Base<any>,
        ) : boolean
        {
            return context.propertyKey === 'child';
        }
        
        public serialize (
            input : Child,
            context : SerializationContext.Serialize,
        ) : any
        {
            context.stopProcessing = true;
            return input.value.toLowerCase();
        }
        
        public deserialize (
            input : string,
            context : SerializationContext.Deserialize,
        ) : any
        {
            context.stopProcessing = true;
            return new Child(input.toUpperCase());
        }
    }
    
    @Srlz.Type('#child')
    class Child
    {
    
        @Srlz.Expose()
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
        
        @Srlz.Type(() => Child)
        @Srlz.Expose()
        @Srlz.Transformer.Serialize({
            after: source => ({ output: source.value.toLowerCase() + '!', final: true }),
        })
        public child2 : Child = new Child('TEXT2');
        
        @Srlz.Expose()
        @Srlz.Transformer({
            serialize: (source) => {
                return { output: source.toLowerCase(), final: true };
            },
        })
        public perPropTrans : string = 'TEXT';
        
    }
    
    it('properly transformate', () => {
        const object = new Entity();
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: '#entity',
            id: 1,
            name: 'Noname',
            createdAt: '2024-03-10T00:50:30.201Z',
            child: 'text',
            child2: 'text2!',
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
        
        const plain = serializer.serialize(object);
        
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
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.deep.equal({
            id: 1,
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
                serialize: source => ({ output: source * 2, final: true }),
            })
            public get computed () : number
            {
                return this.id;
            }
        }
        
        const object = new Entity();
        
        const plain = serializer.serialize(object);
        
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
        
        expect(serializer.serialize(object)).to.deep.equal({
            id: 1,
            computed: 2,
        });
        
        object.computed = 5;
        
        expect(serializer.serialize(object)).to.deep.equal({
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
            serializer.serialize(object, { groups: [ 'group1' ] }),
        ).to.deep.equal({
            id: 1,
            computed: true,
        });
        
        expect(
            serializer.serialize(object),
        ).to.deep.equal({
            id: 1,
            computed: false,
        });
        
        object.computed = null;
        
        expect(
            serializer.serialize(object),
        ).to.deep.equal({
            id: 1,
            computed: null,
        });
    });
});
