import { prepareSerializerContext } from '#/test-helper.js';
import { MetadataStorage, Srlz } from '$/index.js';


prepareSerializerContext('Object', () => {
    @Srlz.Type()
    class Foo
    {
        @Srlz.Expose({ deeply: true })
        public bar;
    }
    
    it('serialization should not flood Object definition', () => {
        const foo = Object.assign(new Foo(), {
            bar: { prroop: true }
        });
        
        const metadataStorage = MetadataStorage.getSingleton();
        expect(
            [ ...metadataStorage.getAllProperties(Foo) ]
        ).to.be.eql([ 'bar' ]);
        
        expect(
            [ ...metadataStorage.getAllProperties(Object) ]
        ).to.be.eql([]);
    });
    
});
