import { prepareSerializerContext } from '#/test-helper.js';
import { serializer, Srlz } from '$/index.js';

const TypeProp = '@type';

prepareSerializerContext('ToClass / Graphs', () => {
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
    
    const plain = {
        [TypeProp]: 'author',
        id: 5,
    };
    
    
    it('graph = true', async() => {
        const object = serializer.toClass(plain, {
            graph: true
        });
        
        expect(object).to.be.instanceof(Author);
        expect(object).to.deep.equal({
            id: undefined,
            name: undefined,
            age: undefined,
            books: undefined,
            aliasedBooks: undefined,
            secret: undefined,
        });
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
            id: 5,
            name: 'John Doe',
            age: 18,
            secret: 12345,
            books: [
                {
                    id: undefined,
                    name: undefined,
                },
                {
                    id: undefined,
                    name: undefined,
                },
            ],
            aliasedBooks: {
                a: {
                    id: undefined,
                    name: undefined,
                },
            }
        });
    });

    it('graph = "**"', async() => {
        const object = serializer.toClass(plain, {
            graph: '**'
        });

        expect(object).to.deep.equal({
            id: 5,
            name: 'John Doe',
            age: 18,
            secret: 12345,
            books: [
                {
                    id: 8,
                    name: 'Book 1',
                },
                {
                    id: 9,
                    name: 'Book 2',
                },
            ],
            aliasedBooks: {
                a: {
                    id: 10,
                    name: 'Book 3',
                },
            }
        });
    });

});
