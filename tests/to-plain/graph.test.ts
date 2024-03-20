import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz, Strategy } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToPlain / Graphs', () => {
    @Srlz.Type('book')
    class Book
    {
        @Srlz.Id()
        public id : number = 5;
        
        public name : string = 'Noname';
        
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
        
        public name : string = 'John Doe';
        
        @Srlz.Exclude()
        public age : number = 18;
        
        @Srlz.Type({ arrayOf: () => Book })
        public books : Book[] = [
            new Book({ id: 8, name: 'Book 1' }),
            new Book({ id: 9, name: 'Book 2' }),
        ];
        
        @Srlz.Type({ recordOf: () => Book })
        public aliasedBooks : Record<string, Book> = {
            a: new Book({ id: 10, name: 'Book 3' }),
        };
        
        public secret : number = 12345;
        
        public constructor (data : Partial<Author> = {})
        {
            Object.assign(this, data);
        }
    }
    
    const object = new Author();
    
    
    it('graph = true', async() => {
        const plain = serializer.toPlain(object, {
            graph: true
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
        });
    });
    
    it('graph = false', async() => {
        const plain = serializer.toPlain(object, {
            graph: false
        });
        
        expect(plain).to.deep.equal(undefined);
    });
    
    it('graph = "*"', async() => {
        const plain = serializer.toPlain(object, {
            graph: '*'
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            age: 18,
            secret: 12345,
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
            }
        });
    });
    
    it('graph = "**"', async() => {
        const plain = serializer.toPlain(object, {
            graph: '**'
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            age: 18,
            secret: 12345,
            books: [
                {
                    [TypeProp]: 'book',
                    id: 8,
                    name: 'Book 1',
                },
                {
                    [TypeProp]: 'book',
                    id: 9,
                    name: 'Book 2',
                },
            ],
            aliasedBooks: {
                a: {
                    [TypeProp]: 'book',
                    id: 10,
                    name: 'Book 3',
                },
            }
        });
    });
    
    it('complex graph - {} and default strategy', async() => {
        const plain = serializer.toPlain(object, {
            graph: {},
            defaultStrategy: Strategy.Expose
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            age: 18,
            secret: 12345,
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
    
    it('complex graph - $default key', async() => {
        const plain = serializer.toPlain(object, {
            graph: {
                $default: true,
                secret: false,
                books: false,
            }
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            age: 18,
            aliasedBooks: {
                a: {
                    [TypeProp]: 'book',
                    id: 10,
                },
            }
        });
    });
    
    it('complex graph - nested object', async() => {
        const plain = serializer.toPlain(object, {
            graph: {
                $default: true,
                secret: false,
                books: {
                    $default: true,
                    name: false,
                },
                aliasedBooks: true
            }
        });
        
        expect(plain).to.deep.equal({
            [TypeProp]: 'author',
            id: 5,
            name: 'John Doe',
            age: 18,
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
            }
        });
    });
});
