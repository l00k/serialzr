import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Serialize / Strategy', () => {
    it('no option strategy, type strategy = expose, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo101',
            modifiers: {
                defaultStrategy: true,
            },
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo101',
            prop: 'prop',
        });
    });
    
    it('no option strategy, type strategy = exclude, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo102',
            modifiers: {
                defaultStrategy: false,
            },
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.serialize(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo102',
        });
    });
    
    it('with option strategy, type strategy = expose, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo103',
            modifiers: {
                defaultStrategy: true,
            },
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.serialize(object, {
            defaultStrategy: false,
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo103',
            prop: 'prop',
        });
    });
    
    it('with option strategy, type strategy = expose, with prop strategy', () => {
        @Srlz.Type({
            name: 'foo104',
            modifiers: {
                defaultStrategy: true,
            },
        })
        class Foo
        {
            @Srlz.Exclude()
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.serialize(object, {
            defaultStrategy: false,
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo104',
        });
    });
    
    
});
