import { prepareSerializerContext } from '#/test-helper.js';
import { Registry, Srlz } from '$/index.js';


prepareSerializerContext('Object', () => {
    @Srlz.Type()
    class Foo
    {
        @Srlz.Expose({ forceExpose: true })
        public bar;
    }
    
    it('serialization should not flood Object definition', () => {
        const foo = Object.assign(new Foo(), {
            bar: { prroop: true },
        });
        
        const registry = Registry.getSingleton();
        expect(
            [ ...registry.getAllProperties(Foo) ],
        ).to.be.eql([ 'bar' ]);
        
        expect(
            [ ...registry.getAllProperties(Object) ],
        ).to.be.eql([]);
    });
    
});
