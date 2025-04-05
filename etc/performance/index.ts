import { serializer, Srlz } from 'serialzr';
import * as Trans from 'class-transformer';
import 'reflect-metadata';

const sampleSize = 25_000;

@Srlz.Type()
class Category
{
    @Srlz.Id()
    @Trans.Expose()
    public id = 2;
    
    @Srlz.Expose()
    @Trans.Expose()
    public name = 'Item';
    
    @Srlz.Expose()
    @Srlz.Type(() => Category)
    @Trans.Expose()
    @Trans.Type(() => Category)
    public child : Category = null;
    
    public constructor (data : Partial<Category> = {})
    {
        Object.assign(this, data);
    }
}

@Srlz.Type()
class Item
{
    @Srlz.Id()
    @Trans.Expose()
    public id = 3;
    
    @Srlz.Expose()
    @Trans.Expose()
    public name = 'Item';
    
    @Srlz.Expose()
    @Srlz.Type(() => Date)
    @Trans.Expose()
    @Trans.Type(() => Date)
    public createdAt = new Date();
    
    @Srlz.Expose()
    @Srlz.Type(() => Category)
    @Trans.Expose()
    @Trans.Type(() => Category)
    public category : Category;
    
    public constructor (data : Partial<Item> = {})
    {
        Object.assign(this, data);
    }
}

@Srlz.Type()
class User
{
    @Srlz.Id()
    @Trans.Expose()
    public id = 2;
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Item })
    @Trans.Expose()
    @Trans.Type(() => Item)
    public items : Item[] = [];
    
    public constructor (data : Partial<User> = {})
    {
        Object.assign(this, data);
    }
}

@Srlz.Type()
class Player
    extends User
{
    public secret = 'unchanged';
    public secret2 = undefined;
    
    @Srlz.Expose()
    @Trans.Expose()
    public name = null;
    
    @Srlz.Exclude([ 'withoutDetails' ]) // exclude on group
    @Srlz.Expose() // expose by default
    @Trans.Exclude()
    @Trans.Expose({ groups: [ 'withoutDetails' ] })
    public description = 'unchanged';
    
    @Srlz.Expose([ 'adminOnly' ])
    @Trans.Expose({ groups: [ 'adminOnly' ] })
    public annotations = 'unchanged';
    
    @Srlz.Expose()
    @Srlz.Type(() => User)
    @Trans.Expose()
    @Trans.Type(() => User)
    public manager : User;
    
    @Srlz.Expose()
    @Trans.Expose()
    public tag1 = 'tag1';
    
    @Srlz.Expose()
    @Srlz.Type(() => Boolean)
    @Trans.Expose()
    @Trans.Type(() => Boolean)
    public tag2 = true;
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tag3 = 3;
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Number })
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tags4 = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Number })
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tags5 = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tag6 = 3;
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tag7 = 3;
    
    @Srlz.Expose()
    @Srlz.Type(() => Number)
    @Trans.Expose()
    @Trans.Type(() => Number)
    public tag8 = 3;
    
    public constructor (data : Partial<Player> = {})
    {
        super(data);
        Object.assign(this, data);
    }
}

const category3 = new Category({
    id: 3,
    name: 'Category 3',
});
category3.child = category3;

const category2 = new Category({
    id: 2,
    name: 'Category 2',
    child: category3,
});
const category1 = new Category({
    id: 1,
    name: 'Root',
    child: category2,
});

const item1 = new Item({
    id: 1,
    name: 'Item 1',
    createdAt: new Date('2023-01-01'),
    category: category1,
});
const item2 = new Item({
    id: 2,
    name: 'Item 2',
    createdAt: new Date('2023-01-05'),
    category: category2,
});

const manager = new Player({
    id: 2,
    name: 'Manager',
    items: [ item1 ],
});

const user = new Player({
    id: 1,
    name: 'Player 1',
    manager,
    items: [ item1, item2 ],
});
user.secret = 'hacker';
user.secret2 = 'hacker';
user.description = 'hacker';
user.annotations = 'hacker';


const output : any = serializer.serialize(user);
console.log(output);

const st1 = Date.now();
for (let i = 0; i < sampleSize; ++i) {
    serializer.serialize(user);
}
const dt1 = (Date.now() - st1) / sampleSize;

console.log('Srlz');
console.log(dt1);

const st2 = Date.now();
for (let i = 0; i < sampleSize; ++i) {
    Trans.instanceToPlain(user, {
        enableCircularCheck: true,
    });
}
const dt2 = (Date.now() - st2) / sampleSize;

console.log('Class-Transformer');
console.log(dt2);

console.log(((dt1 / dt2 - 1) * 100).toFixed(2) + '% slower');
