import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz, Strategy } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToPlain / Strategy', () => {
    it('no option strategy, type strategy = expose, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo101',
            modifiers: {
                defaultStrategy: Strategy.Expose,
            }
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo101',
            prop: 'prop',
        });
    });
    
    it('no option strategy, type strategy = exclude, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo102',
            modifiers: {
                defaultStrategy: Strategy.Exclude,
            }
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.toPlain(object);
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo102',
        });
    });
    
    it('with option strategy, type strategy = expose, no prop strategy', () => {
        @Srlz.Type({
            name: 'foo103',
            modifiers: {
                defaultStrategy: Strategy.Expose,
            }
        })
        class Foo
        {
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.toPlain(object, {
            defaultStrategy: Strategy.Exclude
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
                defaultStrategy: Strategy.Expose,
            }
        })
        class Foo
        {
            @Srlz.Exclude()
            public prop : string = 'prop';
        }
        
        const object = new Foo();
        
        const plain = serializer.toPlain(object, {
            defaultStrategy: Strategy.Expose
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'foo104',
        });
    });
    
    
});
