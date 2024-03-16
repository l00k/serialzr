# Serializer

JS library for serializing and deserializing complex objects into JSON and back.

![NPM Version](https://img.shields.io/npm/v/serialzr)
![GitHub top language](https://img.shields.io/github/languages/top/l00k/serialzr)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/l00k/serialzr/ci.yaml?branch=master)
![Codecov](https://img.shields.io/codecov/c/github/l00k/serialzr)

## Features

- two-way serialization / deserialization without specifying target type - thanks to `@type` property
- defining exposed / excluded properties via groups or graph
- defining custom serialization / deserialization functions (per type or per property)
- built-in support for array of objects and `Record<string, T>` maps


- ESM
- zero dependencies
- full TypeScript support
- covered with tests

## NPM package

```bash
yarn add serialzr
```

## Detailes features

### 1. Property Exclusion and Exposure

You can control which properties are included in the serialized output and which are not.  
This can be done using the `@Srlz.Expose()` and `@Srlz.Exclude()` decorators.

```ts
class Foo
{
    @Srlz.Expose()
    public exposedProperty : string = 'exposed';
    
    @Srlz.Exclude()
    public excludedProperty : string = 'excluded';
}

const plain = serializer.toPlain(new Foo());
// { exposedProperty: 'exposed' }
```

### 2. Grouping

You can specify groups for properties, allowing you to control the serialization and deserialization process based on
these groups.

```ts
class Foo
{
    @Srlz.Expose([ 'group1' ])
    public property1 : string = 'property1';
    
    @Srlz.Expose([ 'group2' ])
    public property2 : string = 'property2';
}

const plain = serializer.toPlain(new Foo(), {
    groups: [ 'group1' ]
});
// { property1: 'property1' }
```

### 3. Auto Groups

The library allows you to automatically add groups based on certain conditions.

```ts
@Srlz.AutoGroup('detailed', (obj, ctx) => ctx.detailedEntries?.includes(obj.id))
class Entry
{
    @Srlz.Id()
    public id : number = 1;
    
    @Srlz.Expose([ 'detailed' ])
    public stats : string = 'stats';
}

const plain = serializer.toPlain(new User(), {
    ctxData: {
        detailedEntries: [ 1, 2 ]
    }
});
// { id: 1, stats: 'stats' }
```

### 4. Graph Serialization

The library supports graph serialization, allowing you to control how nested objects are serialized.

```ts
@Srlz.Type('book')
class Book
{
    @Srlz.Id()
    public id : number = 5;
    
    @Srlz.Expose([ 'public' ])
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
    
    @Srlz.Expose([ 'public' ])
    public name : string = 'John Doe';
    
    @Srlz.Expose([ 'public' ])
    public age : number = 18;
    
    @Srlz.Type({ arrayOf: () => Book })
    public books : Book[] = [
        new Book({ id: 8, name: 'Book 1' }),
        new Book({ id: 9, name: 'Book 2' }),
    ];
    
    @Srlz.Expose([ 'owner' ]) // only owner can see this
    @Srlz.Type({ recordOf: () => Book })
    public aliasedBooks : Record<string, Book> = {
        a: new Book({ id: 10, name: 'Book 3' }),
    };
    
    @Srlz.Exclude() // excluded even if default strategy is to include
    public secret : number = 12345;
    
    public constructor (data : Partial<Author> = {})
    {
        Object.assign(this, data);
    }
}

const plain = serializer.toPlain(new Author(), {
    graph: {
        $default: false,
        id: true,
        name: true,
        books: '**',
        aliasedBooks: {
            id: true,
            name: true,
        }
    }
});
// { 
//      id: 5, 
//      name: 'John Doe', 
//      books: [ 
//          { id: 8, name: 'Book 1' },
//          { id: 9, name: 'Book 2' } 
//      ],
//      aliasedBooks: { 
//          a: { id: 10, name: 'Book 3' }
//      } 
// }
```

### 5. Custom Serialization and Deserialization Strategies

You can define custom strategies for serializing and deserializing properties.

```ts
@Srlz.Transformer({
    toPlain: (obj) => obj.text.toLowerCase(),
    toClass: (plain) => new Tag({ text: plain.toLowerCase() }),
})
class Tag
{
    public text : string = 'tag';
    
    public constructor (data : Partial<Tag> = {})
    {
        Object.assign(this, data);
    }
}
```

## Refrence

### 1. Class decorator `@Srlz.Type()`

As class decorator, it marks the class as a serializable type.

```ts
function Type (typeName : string)
function Type (typeDef : {
    name? : string,
    idProperty? : string,
})
```

### 2. Class decorator `@Srlz.AutoGroup()`

Defines a group that is automatically added to the object based on the condition.

```ts
function AutoGroup (
    groupName : string, // group name
    condition : (
        obj : any, // currently serialized object
        ctx : any // context data (passed to toPlain and toClass methods under ctxData key)
    ) => boolean
)
```

### 3. Class decorator `@Srlz.Transformer()`

Defines custom serialization and deserialization strategies for the class.

```ts
type TransformerFnParams = {
    direction : Direction,
    type : any,
    options? : SerializationOptions.Base<T> | any,
    context? : SerializationContext.Base<T> | any,
}
```

```ts
function Transformer (
    def : {
        toPlain : (obj : any, params : TransformerFnParams) => any,     // serialization function (before exposure calculation)
        toClass : (plain : any, params : TransformerFnParams) => any,   // deserialization function (before exposure calculation)
    }
)
function Transformer (
    def : {
        toPlain : {
            before? : (obj : any, params : TransformerFnParams) => any, // before exposure calculation
            after? : (plain : any, params : TransformerFnParams) => any, // after exposure calculation
        }
        toClass : {
            before? : (plain : any, params : TransformerFnParams) => any, // before exposure calculation
            after? : (obj : any, params : TransformerFnParams) => any, // after exposure calculation
        }
    }
)
```

### 4. Property decorator `@Srlz.Id()`

Marks the property as an identifier.

### 5. Property decorator `@Srlz.Expose()`

Marks the property as exposed.

```ts
function Expose () // exposes property by default
function Expose (groups : string[]) // exposes property only for specified groups
function Expose (def : { // complex configuration
    // modifiers
    mode? : boolean = true, // true - expose, false - exclude
    deeply? : boolean, // expose deeply
    
    // conditions
    all? : string[], // matched if all groups are present
    any? : string[], // matched if any group is present
    notAll? : string[], // matched if no all groups are present
    notAny? : string[], // matched if none of groups is present
}) 
```

### 6. Property decorator `@Srlz.Exclude()`

Marks the property as excluded.  
Sample usage is the same as for `@Srlz.Expose()`.

### 7. Property decorator `@Srlz.Type()`

Defines the type of the property.  
It is required to specify the type of the property if it is not a primitive type.

```ts
function Type (type : () => ClassConstructor) // for single object
function Type (def : {
    type : () => ClassConstructor, // for single object
    arrayOf : () => ClassConstructor, // for array of objects
    recordOf : () => ClassConstructor, // for record of objects
})
```

### 8. Property decorator `@Srlz.Transformer()`

Defines custom serialization and deserialization strategies for the property.  
Usage is the same as for `@Srlz.Transformer()` class decorator.

### 9. Property decorator `@Srlz.Computed()`

Defines a computed property.

```ts
type GetterFn = (args : {
    value : any,                    // current property value
    parent : any,                   // parent object
    params : TransformerFnParams,
}) => any;
```

```ts
function Computed (getterFn : GetterFn)
```


### 10. Property decorator `@Srlz.ComputedByGroup()`

Defines a computed property.

```ts
function ComputedByGroup (
    group : string,                         // group name to match
    ifIncludes : GetterFn = () => true,     // getter function to use if group is included
    ifNotIncludes : GetterFn = () => false, // getter function to use if group is not included
)
```
