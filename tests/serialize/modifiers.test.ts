import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('To Play / Modifiers', () => {
    describe('forceRaw', () => {
        @Srlz.Type('Parent33423')
        class Parent
        {
            @Srlz.Expose()
            @Srlz.Modifiers({ forceRaw: true })
            public data : any;
        }
        
        it('Should ignore futher serialization', () => {
            const object : Parent = new Parent();
            object.data = {
                '@type': 'Parent33423',
                sample: 5,
                deeper: new Parent(),
                complex: [ 1, 2, null, undefined, 'string' ],
            };
            object.data.deeper.data = {
                '@type': 'Parent33423',
                sample: 7,
            };
            
            const plain = serializer.serialize(object);
            
            expect(plain).to.deep.equal({
                '@type': 'Parent33423',
                data: {
                    '@type': 'Parent33423',
                    sample: 5,
                    deeper: {
                        data: {
                            '@type': 'Parent33423',
                            sample: 7,
                        },
                    },
                    complex: [ 1, 2, null, undefined, 'string' ],
                },
            });
        });
    });
});
