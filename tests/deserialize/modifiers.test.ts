import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';


prepareSerializerContext('Deserialize / Modifiers', () => {
    describe('objectMerge', () => {
        class Child
        {
            @Srlz.Expose()
            public id = 3;
        }
        
        @Srlz.Type('foo1153')
        class Parent
        {
            @Srlz.Expose()
            @Srlz.Type({ recordOf: () => Child })
            @Srlz.Modifiers({ objectMerge: true })
            public items : Record<string, Child> = {
                a: Object.assign(new Child(), { id: 5 }),
            };
            
            @Srlz.Modifiers({})
            public get test () : number
            {
                return 5;
            }
        }
        
        it('Should merge to initial value', () => {
            const plain : any = {
                items: {
                    b: { id: 4 },
                },
            };
            
            const obj = serializer.deserialize(plain, {
                type: Parent,
                keepInitialValues: true,
            });
            
            expect(obj)
                .instanceof(Parent)
                .to.containSubset({
                items: {
                    a: {},
                    b: {},
                },
            });
            
            expect(obj.items.a)
                .instanceof(Child)
                .to.eql({ id: 5 });
            
            expect(obj.items.b)
                .instanceof(Child)
                .to.eql({ id: 4 });
        });
    });
    
    describe('arrayAppend', () => {
        class Child
        {
            @Srlz.Expose()
            public id = 3;
        }
        
        class Parent
        {
            @Srlz.Expose()
            @Srlz.Type({ arrayOf: () => Child })
            @Srlz.Modifiers({ arrayAppend: true })
            public items : Child[] = [
                Object.assign(new Child(), { id: 5 }),
            ];
        }
        
        it('Should merge to initial value', () => {
            const plain : any = {
                items: [
                    { id: 4 },
                ],
            };
            
            const obj = serializer.deserialize(plain, {
                type: Parent,
                keepInitialValues: true,
            });
            
            expect(obj)
                .instanceof(Parent)
                .to.containSubset({
                items: [ {}, {} ],
            });
            
            expect(obj.items[0])
                .instanceof(Child)
                .to.eql({ id: 5 });
            
            expect(obj.items[1])
                .instanceof(Child)
                .to.eql({ id: 4 });
        });
    });
    
    describe('keepInitialValues', () => {
        @Srlz.Modifiers({
            keepInitialValues: false,
        })
        class Parent
        {
            @Srlz.Expose()
            public item : number = 1;
        }
        
        it('Should merge to initial value', () => {
            const plain : any = {};
            
            const obj = serializer.deserialize(plain, {
                type: Parent,
            });
            
            expect(obj)
                .instanceof(Parent)
                .to.deep.equal({});
        });
    });
    
    describe('forceRaw', () => {
        @Srlz.Type('Parent33423')
        class Parent
        {
            @Srlz.Expose()
            @Srlz.Modifiers({ forceRaw: true })
            public data : any;
        }
        
        it('Should ignore futher serialization', () => {
            const plain : any = {
                data: {
                    '@type': 'Parent33423',
                    sample: 5,
                    deeper: {
                        '@type': 'Parent33423',
                        sample: 7,
                    },
                    complex: [ 1, 2, null, undefined, 'string' ],
                },
            };
            
            const obj = serializer.deserialize(plain, {
                type: Parent,
            });
            
            expect(obj).instanceof(Parent);
            expect(obj).to.deep.equal({
                data: {
                    '@type': 'Parent33423',
                    sample: 5,
                    deeper: {
                        '@type': 'Parent33423',
                        sample: 7,
                    },
                    complex: [ 1, 2, null, undefined, 'string' ],
                },
            });
        });
    });
});
