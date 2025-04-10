import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('Deserialize / Graphs', () => {
    @Srlz.Type('book')
    class Book
    {
        @Srlz.Id()
        public id : number = 4;
        
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
        @Srlz.Expose()
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
    
    const plain = {
        [TypeProp]: 'author',
        id: 6,
        name: 'Johny Doeee',
        age: 32,
        books: [
            {
                [TypeProp]: 'book',
                id: 5,
                name: 'Aaaa',
            },
        ],
        aliasedBooks: {
            c: {
                [TypeProp]: 'book',
                id: 7,
                name: 'Cccc',
            },
        },
        secret: 54321,
    };
    
    
    it('graph = true', async() => {
        const object = serializer.deserialize(plain, {
            graph: true,
        });
        
        expect(object).to.be.instanceof(Author);
        expect(object).to.deep.eq(new Author());
    });
    
    it('graph = false', async() => {
        const object = serializer.deserialize(plain, {
            graph: false,
        });
        
        expect(object).to.deep.equal(undefined);
    });
    
    it('graph = "*"', async() => {
        const object = serializer.deserialize(plain, {
            graph: '*',
        });
        
        expect(object).to.be.instanceof(Author);
        expect(object).to.deep.equal({
            id: 6,
            name: 'John Doe',
            age: 18,
            secret: 12345,
            books: [
                {
                    id: 4,
                    name: 'Noname',
                },
            ],
            aliasedBooks: {
                a: {
                    id: 10,
                    name: 'Book 3',
                },
            },
        });
    });
    
    it('graph = "**"', async() => {
        const object = serializer.deserialize(plain, {
            graph: '**',
        });
        
        expect(object).to.deep.equal({
            id: 6,
            name: 'John Doe',
            age: 18,
            secret: 12345,
            books: [
                {
                    id: 5,
                    name: 'Noname',
                },
            ],
            aliasedBooks: {
                a: {
                    id: 10,
                    name: 'Book 3',
                },
            },
        });
    });
    
});
