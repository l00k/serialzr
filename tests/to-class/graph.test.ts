import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToClass / Graphs', () => {
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
            {
                [TypeProp]: 'book',
                id: 6,
                name: 'Bbbb',
            }
        ],
        aliasedBooks: {
            c: {
                [TypeProp]: 'book',
                id: 7,
                name: 'Cccc',
            }
        },
        secret: 54321,
    };
    
    
    it('graph = true', async() => {
        const object = serializer.toClass(plain, {
            graph: true
        });
        
        expect(object).to.be.instanceof(Author);
        expect(object).to.deep.eq(new Author());
    });
    
    it('graph = false', async() => {
        const object = serializer.toClass(plain, {
            graph: false
        });
        
        expect(object).to.deep.equal(undefined);
    });
    
    it('graph = "*"', async() => {
        const object = serializer.toClass(plain, {
            graph: '*'
        });

        expect(object).to.be.instanceof(Author);
        expect(object).to.deep.equal({
            id: 6,
            name: 'Johny Doeee',
            age: 32,
            secret: 54321,
            books: [
                {
                    id: 4,
                    name: 'Noname',
                },
                {
                    id: 4,
                    name: 'Noname',
                },
            ],
            aliasedBooks: {
                c: {
                    id: 4,
                    name: 'Noname',
                },
            }
        });
    });

    it('graph = "**"', async() => {
        const object = serializer.toClass(plain, {
            graph: '**'
        });

        expect(object).to.deep.equal({
            id: 6,
            name: 'Johny Doeee',
            age: 32,
            secret: 54321,
            books: [
                {
                    id: 5,
                    name: 'Aaaa',
                },
                {
                    id: 6,
                    name: 'Bbbb',
                },
            ],
            aliasedBooks: {
                c: {
                    id: 7,
                    name: 'Cccc',
                },
            }
        });
    });

});
