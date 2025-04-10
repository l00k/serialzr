import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Serialize / Groups', () => {
    describe('type #1 - simple groups', () => {
        @Srlz.Type('foo51')
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
        
        const object = new Foo();
        
        
        it('without specifiying any group', () => {
            const plain = serializer.serialize(object);
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo51',
                id: 2,
                defaultExpose: 'defaultExpose',
            });
        });
        
        it('with expose group specified', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group1' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo51',
                id: 2,
                defaultExpose: 'defaultExpose',
                exposeWithGroups: 'exposeWithGroups',
            });
        });
        
        it('with multiple groups - priority checking', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group2', 'group3' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo51',
                id: 2,
                defaultExpose: 'defaultExpose',
                usingPriority2: 'usingPriority2',
            });
        });
        
        it('without specifiying any group + default expose', () => {
            const plain = serializer.serialize(object, {
                defaultStrategy: true,
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo51',
                id: 2,
                defaultExpose: 'defaultExpose',
                exposeWithGroups: 'exposeWithGroups',
                usingPriority1: 'usingPriority1',
                usingPriority2: 'usingPriority2',
                excludeWithGroups: 'excludeWithGroups',
                nonDecorated: 'nonDecorated',
            });
        });
    });
    
    describe('type #2 - advanced group expressions', () => {
        @Srlz.Type('foo52')
        class Foo
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Expose({ all: [ 'group1', 'group2' ] })
            public allModificator : string = 'allModificator';
            
            @Srlz.Expose({ any: [ 'group3', 'group4' ] })
            public anyModificator : string = 'anyModificator';
            
            @Srlz.Expose({ notAll: [ 'group5', 'group6' ] })
            public notAllModificator : string = 'notAllModificator';
            
            @Srlz.Expose({ notAny: [ 'group7', 'group8' ] })
            public notAnyModificator : string = 'notAnyModificator';
            
            @Srlz.Expose({
                all: [ 'group1', 'group2' ],
                any: [ 'group3', 'group4' ],
                notAll: [ 'group5', 'group6' ],
                notAny: [ 'group7', 'group8' ],
            })
            public multiple : string = 'multiple';
        }
        
        const object = new Foo();
        
        
        it('all modificator - not matched', () => {
            const plain1 = serializer.serialize(object, {
                groups: [],
            });
            const plain2 = serializer.serialize(object, {
                groups: [ 'group1' ],
            });
            const plain3 = serializer.serialize(object, {
                groups: [ 'group2' ],
            });
            
            for (const plain of [ plain1, plain2, plain3 ]) {
                expect(plain).to.deep.equal({
                    [TypeProp]: 'foo52',
                    id: 2,
                    notAllModificator: 'notAllModificator',
                    notAnyModificator: 'notAnyModificator',
                    multiple: 'multiple',
                });
            }
        });
        
        it('all modificator - matched', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group1', 'group2' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo52',
                id: 2,
                allModificator: 'allModificator',
                notAllModificator: 'notAllModificator',
                notAnyModificator: 'notAnyModificator',
                multiple: 'multiple',
            });
        });
        
        it('any modificator', () => {
            const plain1 = serializer.serialize(object, {
                groups: [ 'group3' ],
            });
            const plain2 = serializer.serialize(object, {
                groups: [ 'group4' ],
            });
            const plain3 = serializer.serialize(object, {
                groups: [ 'group3', 'group4' ],
            });
            
            for (const plain of [ plain1, plain2, plain3 ]) {
                expect(plain).to.deep.equal({
                    [TypeProp]: 'foo52',
                    id: 2,
                    anyModificator: 'anyModificator',
                    notAllModificator: 'notAllModificator',
                    notAnyModificator: 'notAnyModificator',
                    multiple: 'multiple',
                });
            }
        });
        
        it('not all modificator - not matched', () => {
            const plain1 = serializer.serialize(object, {
                groups: [ 'group5' ],
            });
            const plain2 = serializer.serialize(object, {
                groups: [ 'group6' ],
            });
            
            for (const plain of [ plain1, plain2 ]) {
                expect(plain).to.deep.equal({
                    [TypeProp]: 'foo52',
                    id: 2,
                    notAllModificator: 'notAllModificator',
                    notAnyModificator: 'notAnyModificator',
                    multiple: 'multiple',
                });
            }
        });
        
        it('not all modificator - matched', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group5', 'group6' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo52',
                id: 2,
                notAnyModificator: 'notAnyModificator',
            });
        });
        
        it('not any modificator - not matched', () => {
            const plain1 = serializer.serialize(object, {
                groups: [ 'group5' ],
            });
            const plain2 = serializer.serialize(object, {
                groups: [ 'group6' ],
            });
            
            for (const plain of [ plain1, plain2 ]) {
                expect(plain).to.deep.equal({
                    [TypeProp]: 'foo52',
                    id: 2,
                    notAllModificator: 'notAllModificator',
                    notAnyModificator: 'notAnyModificator',
                    multiple: 'multiple',
                });
            }
        });
        
        it('not any modificator', () => {
            const plain1 = serializer.serialize(object, {
                groups: [ 'group7' ],
            });
            const plain2 = serializer.serialize(object, {
                groups: [ 'group8' ],
            });
            const plain3 = serializer.serialize(object, {
                groups: [ 'group7', 'group8' ],
            });
            
            for (const plain of [ plain1, plain2, plain3 ]) {
                expect(plain).to.deep.equal({
                    [TypeProp]: 'foo52',
                    id: 2,
                    notAllModificator: 'notAllModificator',
                });
            }
        });
    });
    
    describe('type #3 - nested object', () => {
        @Srlz.Type('bar53')
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
        
        @Srlz.Type('foo53')
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
        
        const object = new Foo();
        
        
        it('single nested object', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group1' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo53',
                id: 2,
                singleChild: {
                    [TypeProp]: 'bar53',
                    id: 6,
                    g1: 1,
                },
            });
        });
        
        it('nested array of objects', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group2' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo53',
                id: 2,
                childsArray: [
                    {
                        [TypeProp]: 'bar53',
                        id: 7,
                        g2: 2,
                    },
                    {
                        [TypeProp]: 'bar53',
                        id: 8,
                        g2: 2,
                    },
                ],
            });
        });
        
        it('nested record of objects', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group3' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo53',
                id: 2,
                childsRecord: {
                    a: {
                        [TypeProp]: 'bar53',
                        id: 9,
                        g3: 3,
                    },
                    b: {
                        [TypeProp]: 'bar53',
                        id: 10,
                        g3: 3,
                    },
                    c: {
                        [TypeProp]: 'bar53',
                        id: 11,
                        g3: 3,
                    },
                },
            });
        });
    });
    
    
    describe('type #4 - circular references', () => {
        @Srlz.Type('foo54')
        class Person
        {
            @Srlz.Id()
            public name : string = 'noname';
            
            @Srlz.Type(() => Person)
            @Srlz.Expose()
            public supervisor : Person;
            
            @Srlz.Type({ arrayOf: () => Person })
            @Srlz.Expose()
            public subs : Person[];
            
            @Srlz.Type({ recordOf: () => Person })
            @Srlz.Expose()
            public subsAliased : Record<string, Person>;
            
            public constructor (data : Partial<Person> = {})
            {
                Object.assign(this, data);
            }
        }
        
        const employee1 = new Person({ name: 'employee1' });
        const employee2 = new Person({ name: 'employee2' });
        
        const manager = new Person({
            name: 'manager',
            subs: [ employee1, employee2 ],
            subsAliased: { a: employee1, b: employee2 },
        });
        employee1.supervisor = manager;
        employee2.supervisor = manager;
        
        const boss = new Person({
            name: 'boss',
            subs: [ manager ],
            subsAliased: { c: manager },
        });
        manager.supervisor = boss;
        
        
        it('should catch circular references - from top to bottom', () => {
            employee1.subs = [];
            const plain = serializer.serialize(boss);
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo54',
                name: 'boss',
                subs: [
                    {
                        [TypeProp]: 'foo54',
                        name: 'manager',
                        supervisor: {
                            [TypeProp]: 'foo54',
                            name: 'boss',
                        },
                        subs: [
                            {
                                [TypeProp]: 'foo54',
                                name: 'employee1',
                                subs: [],
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                            {
                                [TypeProp]: 'foo54',
                                name: 'employee2',
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                        ],
                        subsAliased: {
                            a: {
                                [TypeProp]: 'foo54',
                                name: 'employee1',
                                subs: [],
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                            b: {
                                [TypeProp]: 'foo54',
                                name: 'employee2',
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                        },
                    },
                ],
                subsAliased: {
                    c: {
                        [TypeProp]: 'foo54',
                        name: 'manager',
                        supervisor: {
                            [TypeProp]: 'foo54',
                            name: 'boss',
                        },
                        subs: [
                            {
                                [TypeProp]: 'foo54',
                                name: 'employee1',
                                subs: [],
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                            {
                                [TypeProp]: 'foo54',
                                name: 'employee2',
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                        ],
                        subsAliased: {
                            a: {
                                [TypeProp]: 'foo54',
                                name: 'employee1',
                                subs: [],
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                            b: {
                                [TypeProp]: 'foo54',
                                name: 'employee2',
                                supervisor: {
                                    [TypeProp]: 'foo54',
                                    name: 'manager',
                                },
                            },
                        },
                    },
                },
            });
        });
        
        it('should properly handle depth', () => {
            const plain = serializer.serialize(boss, {
                maxDepth: 1,
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo54',
                name: 'boss',
                subs: [
                    {
                        [TypeProp]: 'foo54',
                        name: 'manager',
                    },
                ],
                subsAliased: {
                    c: {
                        [TypeProp]: 'foo54',
                        name: 'manager',
                    },
                },
            });
        });
        
        it('should properly handle depth', () => {
            const plain = serializer.serialize(boss, {
                maxDepth: 0,
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo54',
                name: 'boss',
            });
        });
        
        it('should catch circular references - from bottom to top', () => {
            const plain = serializer.serialize(employee1);
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo54',
                name: 'employee1',
                subs: [],
                supervisor: {
                    [TypeProp]: 'foo54',
                    name: 'manager',
                    supervisor: {
                        [TypeProp]: 'foo54',
                        name: 'boss',
                        subs: [
                            {
                                [TypeProp]: 'foo54',
                                name: 'manager',
                            },
                        ],
                        subsAliased: {
                            c: {
                                [TypeProp]: 'foo54',
                                name: 'manager',
                            },
                        },
                    },
                    subs: [
                        {
                            [TypeProp]: 'foo54',
                            name: 'employee1',
                        },
                        {
                            [TypeProp]: 'foo54',
                            name: 'employee2',
                            supervisor: {
                                [TypeProp]: 'foo54',
                                name: 'manager',
                            },
                        },
                    ],
                    subsAliased: {
                        a: {
                            [TypeProp]: 'foo54',
                            name: 'employee1',
                        },
                        b: {
                            [TypeProp]: 'foo54',
                            name: 'employee2',
                            supervisor: {
                                [TypeProp]: 'foo54',
                                name: 'manager',
                            },
                        },
                    },
                },
            });
        });
    });
    
    describe('type #5 - inheritance', () => {
        @Srlz.Type('foo55')
        class Foo
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Expose([ 'group1' ])
            public baseFieldOnly : string = 'baseFieldOnly';
            
            @Srlz.Expose([ 'group2' ])
            public overrideGroups : string = 'overrideGroups';
            
            @Srlz.Exclude({
                any: [ 'group3' ],
            })
            public overrideMode : string = 'overrideMode';
            
            public nonDecorated : string = 'nonDecorated';
        }
        
        @Srlz.Type('bar55')
        class Bar
            extends Foo
        {
            @Srlz.Expose([ 'group4' ])
            public overrideGroups : string = 'overrideGroups';
            
            @Srlz.Expose()
            public overrideMode : string = 'overrideMode';
        }
        
        const object = new Bar();
        
        
        it('groups should be overriden', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group1', 'group2' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'bar55',
                id: 2,
                baseFieldOnly: 'baseFieldOnly',
                overrideMode: 'overrideMode',
            });
        });
        
        it('expose expr should be overriden', () => {
            const plain = serializer.serialize(object, {
                groups: [ 'group3' ],
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'bar55',
                id: 2,
                overrideMode: 'overrideMode',
            });
        });
    });
    
    describe('type #6 - auto groups', () => {
        @Srlz.Type('foo56')
        @Srlz.AutoGroup('admin', (obj, ctx) => ctx.users?.includes(obj.id))
        @Srlz.AutoGroup([ 'lowId' ], (obj) => obj.id < 10)
        class Foo
        {
            @Srlz.Id()
            public id : number = 2;
            
            @Srlz.Expose([ 'admin' ])
            public stats : string = 'stats';
        }
        
        const object = new Foo();
        
        
        it('groups should be automatically added', () => {
            const plain = serializer.serialize(object, {
                ctxData: {
                    users: [ 2 ],
                },
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo56',
                id: 2,
                stats: 'stats',
            });
        });
        
        it('groups should not be automatically added', () => {
            const plain = serializer.serialize(object, {
                ctxData: {
                    users: [],
                },
            });
            
            expect(plain).to.deep.equal({
                [TypeProp]: 'foo56',
                id: 2,
            });
        });
    });
});
