import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Serialize / Graphs', () => {
    @Srlz.Type('tag')
    class Tag
    {
        @Srlz.Id()
        public id : number = 5;
        
        @Srlz.Expose()
        public tag : string = 'ABC';
        
        public constructor (data : Partial<Tag> = {})
        {
            Object.assign(this, data);
        }
    }
    
    @Srlz.Type('book')
    class Book
    {
        @Srlz.Id()
        public id : number = 5;
        
        @Srlz.Expose()
        public name : string = 'Noname';
        
        @Srlz.Expose()
        @Srlz.Type(() => Tag)
        public tag : Tag = new Tag();
        
        public constructor (data : Partial<Book> = {})
        {
            Object.assign(this, data);
        }
    }
    
    @Srlz.Type('author')
    class Author
    {
        @Srlz.Id()
        public id : number = 5;
        
        @Srlz.Expose()
        public name : string = 'John Doe';
        
        @Srlz.Exclude()
        public secret : number = 18;
        
        @Srlz.Expose()
        @Srlz.Type({ arrayOf: () => Book })
        public books : Book[] = [
            new Book({
                id: 8,
                name: 'Book 1',
                tag: new Tag({ id: 7, tag: 'ABC' }),
            }),
            new Book({
                id: 9,
                name: 'Book 2',
                tag: new Tag({ id: 8, tag: 'XYZ' }),
            }),
            ];
        
        @Srlz.Type({ recordOf: () => Book })
        public aliasedBooks : Record<string, Book> = {
            a: new Book({
                id: 10,
                name: 'Book 3',
                tag: new Tag({ id: 8, tag: 'DEF' }),
            }),
            };
        
        public internal : number = 12345;
        
        public constructor (data : Partial<Author> = {})
        {
            Object.assign(this, data);
        }
    }
    
    const object = new Author();
    
    
    it('native / graph = true', async() => {
        const plain = serializer.serialize(5, {
            graph: true,
        });
        
        expect(plain).to.deep.equal(5);
    });
    
    it('complex / graph = true', async() => {
        const plain = serializer.serialize(object, {
            graph: true,
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
        });
    });
    
    it('native / graph = false', async() => {
        const plain = serializer.serialize(5, {
            graph: false,
        });
        
        expect(plain).to.deep.equal(undefined);
    });
    
    it('complex / graph = false', async() => {
        const plain = serializer.serialize(object, {
            graph: false,
        });
        
        expect(plain).to.deep.equal(undefined);
    });
    
    it('complex / graph = *', async() => {
        const plain = serializer.serialize(object, {
            graph: '*',
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
        });
    });
    
    it('graph = **', async() => {
        const plain = serializer.serialize(object, {
            graph: '**',
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                    name: 'Book 1',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 7,
                        tag: 'ABC',
                    },
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                    name: 'Book 2',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 8,
                        tag: 'XYZ',
                    },
                },
            ],
        });
    });
    
    it('graph = number', async() => {
        const plain = serializer.serialize(object, {
            graph: 2,
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
        });
    });
    
    it('graph = {}', async() => {
        const plain = serializer.serialize(object, {
            graph: {},
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
        });
    });
    
    it('graph = {} and default expose', async() => {
        const plain = serializer.serialize(object, {
            graph: {},
            defaultStrategy: true,
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
        });
    });
    
    it('graph = { $default: true }', async() => {
        const plain = serializer.serialize(object, {
            graph: { $default: true },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
        });
    });
    
    it('graph = { $default: false, name: true }', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: false,
                name: true,
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
        });
    });
    
    it('graph = { $default: true } + other props', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: true,
                internal: false,
                books: false,
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
        });
    });
    
    it('graph = { $default: 1 }', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: 1,
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
        });
    });
    
    it('graph = { $default: * }', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: '*',
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                    name: 'Book 1',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 7,
                    },
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                    name: 'Book 2',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 8,
                    },
                },
            ],
        });
    });
    
    it('graph = { $default: ** }', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: '**',
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                    name: 'Book 1',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 7,
                        tag: 'ABC',
                    },
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                    name: 'Book 2',
                    tag: {
                        [TypeProp]: 'tag',
                        id: 8,
                        tag: 'XYZ',
                    },
                },
            ],
        });
    });
    
    it('graph = { $default: { $expose: 1 } }', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: { $expose: 1 },
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
        });
    });
    
    it('complex graph - nested object', async() => {
        const plain = serializer.serialize(object, {
            graph: {
                $default: true,
                internal: false,
                books: {
                    name: false,
                },
                aliasedBooks: true,
            },
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                },
            ],
            aliasedBooks: {
                a: {
                    [TypeProp]: 'book',
                    id: 10,
                },
            },
        });
    });
});
