import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz, Strategy } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToClass / Groups', () => {
    describe('type #1 - simple groups', () => {
        @Srlz.Type('foo1')
        class Foo
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Expose()
            public defaultExpose : string = 'defaultExpose';
            
            @Srlz.Expose([ 'group1' ])
            public exposeWithGroups : string = 'exposeWithGroups';
            
            @Srlz.Exclude([ 'group2' ])
            @Srlz.Expose([ 'group3' ])
            public usingPriority1 : string = 'usingPriority1';
            
            @Srlz.Expose([ 'group3' ])
            @Srlz.Exclude([ 'group2' ])
            public usingPriority2 : string = 'usingPriority2';
            
            @Srlz.Exclude()
            public defaultExlude : string = 'defaultExlude';
            
            @Srlz.Exclude([ 'group4' ])
            public excludeWithGroups : string = 'excludeWithGroups';
            
            public nonDecorated : string = 'nonDecorated';
        }
        
        const plain = {
            [TypeProp]: 'foo1',
            id: 3,
            defaultExpose: 'changed',
            exposeWithGroups: 'changed',
            usingPriority1: 'changed',
            usingPriority2: 'changed',
            excludeWithGroups: 'changed',
            nonDecorated: 'changed',
        };
        
        
        it('without specifiying any group', () => {
            const object = serializer.toClass(plain, {
                type: Foo
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 3,
                defaultExpose: 'changed',
                exposeWithGroups: 'exposeWithGroups',
                usingPriority1: 'usingPriority1',
                usingPriority2: 'usingPriority2',
                defaultExlude: 'defaultExlude',
                excludeWithGroups: 'excludeWithGroups',
                nonDecorated: 'nonDecorated',
            });
        });
        
        it('with expose group specified', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                groups: [ 'group1' ]
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 3,
                defaultExpose: 'changed',
                exposeWithGroups: 'changed',
                usingPriority1: 'usingPriority1',
                usingPriority2: 'usingPriority2',
                defaultExlude: 'defaultExlude',
                excludeWithGroups: 'excludeWithGroups',
                nonDecorated: 'nonDecorated',
            });
        });
        
        it('with multiple groups - priority checking', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                groups: [ 'group2', 'group3' ]
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 3,
                defaultExpose: 'changed',
                exposeWithGroups: 'exposeWithGroups',
                usingPriority1: 'usingPriority1',
                usingPriority2: 'changed',
                defaultExlude: 'defaultExlude',
                excludeWithGroups: 'excludeWithGroups',
                nonDecorated: 'nonDecorated',
            });
        });
        
        it('without specifiying any group + default expose', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                strategy: Strategy.Expose
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 3,
                defaultExpose: 'changed',
                exposeWithGroups: 'changed',
                usingPriority1: 'changed',
                usingPriority2: 'changed',
                defaultExlude: 'defaultExlude',
                excludeWithGroups: 'changed',
                nonDecorated: 'changed',
            });
        });
    });
    
    
    describe('type #2 - nested object', () => {
        @Srlz.Type('bar3')
        class Bar
        {
            @Srlz.Id()
            public id : number = 5;
            
            @Srlz.Expose([ 'group1' ])
            public g1 : number = 1;
            
            @Srlz.Expose([ 'group2' ])
            public g2 : number = 2;
            
            @Srlz.Expose([ 'group3' ])
            public g3 : number = 3;
            
            public constructor (id : number)
            {
                this.id = id;
            }
        }
        
        @Srlz.Type('foo3')
        class Foo
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Type(() => Bar)
            @Srlz.Expose([ 'group1' ])
            public singleChild : Bar = new Bar(6);
            
            @Srlz.Type({ arrayOf: () => Bar })
            @Srlz.Expose([ 'group2' ])
            public childsArray : Bar[] = [
                new Bar(7),
                new Bar(8),
            ];
            
            @Srlz.Type({ recordOf: () => Bar })
            @Srlz.Expose([ 'group3' ])
            public childsRecord : Record<string, Bar> = {
                a: new Bar(9),
                b: new Bar(10),
                c: new Bar(11),
            };
        }
        
        const plain = {
            [TypeProp]: 'foo3',
            id: 5,
            singleChild: { [TypeProp]: 'bar3', id: 11, g1: 5, g2: 6, g3: 7, },
            childsArray: [
                { [TypeProp]: 'bar3', id: 12, g1: 3, g2: 4, g3: 5, },
                { [TypeProp]: 'bar3', id: 13, g1: 4, g2: 5, g3: 6, },
                'wrong',
                null,
                undefined,
                false,
                true,
                12,
            ],
            childsRecord: {
                a: { [TypeProp]: 'bar3', id: 14, g1: 13, g2: 14, g3: 15, }
            }
        };
        
        
        it('single nested object', () => {
            const object = serializer.toClass(plain, {
                type: Foo
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 5,
                singleChild: { id: 6, g1: 1, g2: 2, g3: 3, },
                childsArray: [
                    { id: 7, g1: 1, g2: 2, g3: 3, },
                    { id: 8, g1: 1, g2: 2, g3: 3, },
                ],
                childsRecord: {
                    a: { id: 9, g1: 1, g2: 2, g3: 3, },
                    b: { id: 10, g1: 1, g2: 2, g3: 3, },
                    c: { id: 11, g1: 1, g2: 2, g3: 3, },
                }
            });
            
            for (const child of [ object.singleChild, ...object.childsArray, object.childsRecord.a ]) {
                expect(child).to.be.instanceof(Bar);
            }
        });
        
        it('single nested object', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                groups: [ 'group1' ],
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 5,
                singleChild: { id: 11, g1: 5, g2: 2, g3: 3, },
                childsArray: [
                    { id: 7, g1: 1, g2: 2, g3: 3, },
                    { id: 8, g1: 1, g2: 2, g3: 3, },
                ],
                childsRecord: {
                    a: { id: 9, g1: 1, g2: 2, g3: 3, },
                    b: { id: 10, g1: 1, g2: 2, g3: 3, },
                    c: { id: 11, g1: 1, g2: 2, g3: 3, },
                }
            });
            
            for (const child of [ object.singleChild, ...object.childsArray, object.childsRecord.a ]) {
                expect(child).to.be.instanceof(Bar);
            }
        });
        
        it('nested array of objects', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                groups: [ 'group2' ],
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 5,
                singleChild: { id: 6, g1: 1, g2: 2, g3: 3, },
                childsArray: [
                    { id: 12, g1: 1, g2: 4, g3: 3, },
                    { id: 13, g1: 1, g2: 5, g3: 3, },
                ],
                childsRecord: {
                    a: { id: 9, g1: 1, g2: 2, g3: 3, },
                    b: { id: 10, g1: 1, g2: 2, g3: 3, },
                    c: { id: 11, g1: 1, g2: 2, g3: 3, },
                }
            });
            
            for (const child of [ object.singleChild, ...object.childsArray, object.childsRecord.a ]) {
                expect(child).to.be.instanceof(Bar);
            }
        });
        
        it('nested record of objects', () => {
            const object = serializer.toClass(plain, {
                type: Foo,
                groups: [ 'group3' ],
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 5,
                singleChild: { id: 6, g1: 1, g2: 2, g3: 3, },
                childsArray: [
                    { id: 7, g1: 1, g2: 2, g3: 3, },
                    { id: 8, g1: 1, g2: 2, g3: 3, },
                ],
                childsRecord: {
                    a: { id: 14, g1: 1, g2: 2, g3: 15, }
                }
            });
            
            for (const child of [ object.singleChild, ...object.childsArray, object.childsRecord.a ]) {
                expect(child).to.be.instanceof(Bar);
            }
        });
    });
    
    
    describe('type #3 - inheritance + type discrimination', () => {
        @Srlz.Type('animal')
        class Animal
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Expose([ 'group1' ])
            public name : string = 'animal';
            
            @Srlz.Expose([ 'group2' ])
            public sound : string = 'nothing';
        }
        
        @Srlz.Type('animal/dog')
        class Dog
            extends Animal
        {
            public name : string = 'dog';
            public sound : string = 'bark';
            
            @Srlz.Expose()
            public race : string = 'labrador';
        }
        
        @Srlz.Type('animal/cat')
        class Cat
            extends Animal
        {
            public name : string = 'cat';
            public sound : string = 'meow';
            
            @Srlz.Expose()
            public size : string = 'small';
        }
        
        
        it('should transform to proper type by explict type', () => {
            const plain = {
                [TypeProp]: 'animal/cat',
                id: 4,
                name: 'doggie',
                sound: 'barkie',
                race: 'labradorry',
                size: 'small',
            };
            
            const object = serializer.toClass(plain, {
                type: Dog,
                groups: [ 'group1' ],
            });
            
            expect(object).to.be.instanceof(Dog);
            expect(object).to.deep.equal({
                id: 4,
                name: 'doggie',
                sound: 'bark',
                race: 'labradorry',
            });
        });
        
        it('should transform to proper type by explict type name', () => {
            const plain = {
                [TypeProp]: 'animal/cat',
                id: 4,
                name: 'doggie',
                sound: 'barkie',
                race: 'labradorry',
                size: 'small',
            };
            
            const object = serializer.toClass(plain, {
                type: 'animal/dog',
                groups: [ 'group1' ],
            });
            
            expect(object).to.be.instanceof(Dog);
            expect(object).to.deep.equal({
                id: 4,
                name: 'doggie',
                sound: 'bark',
                race: 'labradorry',
            });
        });
        
        it('should throw for unknown type name', () => {
            const plain = {
                [TypeProp]: 'animal/cat',
                id: 4,
            };
            
            const fn = () => serializer.toClass(plain, {
                type: 'animal/dogxxx',
                groups: [ 'group1' ],
            });
            
            expect(fn).to.throw('Unknown type name');
        });
        
        it('should transform to proper type by @type', () => {
            const plain = {
                [TypeProp]: 'animal/dog',
                id: 4,
                name: 'doggie',
                sound: 'barkie',
                race: 'labradorry',
                size: 'small',
            };
            
            const object = serializer.toClass(plain, {
                groups: [ 'group1' ],
            });
            
            expect(object).to.be.instanceof(Dog);
            expect(object).to.deep.equal({
                id: 4,
                name: 'doggie',
                sound: 'bark',
                race: 'labradorry',
            });
        });
        
        it('should transform to proper type by @type property with allowed constraint', () => {
            const plain = {
                [TypeProp]: 'animal/dog',
                id: 4,
                name: 'doggie',
                sound: 'barkie',
                race: 'labradorry',
                size: 'small',
            };
            
            const object = serializer.toClass(plain, {
                type: Animal,
                groups: [ 'group1' ],
            });
            
            expect(object).to.be.instanceof(Dog);
            expect(object).to.deep.equal({
                id: 4,
                name: 'doggie',
                sound: 'bark',
                race: 'labradorry',
            });
        });
    });
    
    describe('type #4 - auto groups', () => {
        @Srlz.Type('foo6')
        @Srlz.AutoGroup('admin', (obj, ctx) => ctx.users?.includes(obj.id))
        @Srlz.AutoGroup([ 'lowId' ], (obj) => obj.id < 10)
        class Foo
        {
            @Srlz.Id()
            public id : number = 1;
            
            @Srlz.Expose([ 'admin' ])
            public stats : string = 'stats';
        }
        
        const plain = {
            [TypeProp]: 'foo6',
            id: 2,
            stats: 'xxx'
        };
        
        
        it('groups should be automatically added', () => {
            const object = serializer.toClass(plain, {
                ctxData: {
                    users: [ 2 ]
                }
            });
            
            expect(object).to.be.instanceof(Foo);
            expect(object).to.deep.equal({
                id: 2,
                stats: 'xxx',
            });
        });
        
        it('groups should not be automatically added', () => {
            const object = serializer.toClass(plain, {
                ctxData: {
                    users: []
                }
            });
            
            expect(object).to.deep.equal({
                id: 2,
                stats: 'stats',
            });
        });
    });
});
