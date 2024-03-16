# Serializer

JS library for serializing and deserializing complex objects into JSON and back.

![NPM Version](https://img.shields.io/npm/v/serialzr)


## Features
- two-way serialization / deserialization without specifying target type - thanks to `@type` property
- defining exposed / excluded properties via groups or graph
- defining custom serialization / deserialization functions (per type or per property)
- built-in support for array of objects and `Record<string, T>` maps


- zero dependencies
- full TypeScript support
- test coverage > 95%

## NPM package
```bash
yarn add serialzr
```

## Sample
```ts
@Srlz.Type('veryComplexObject')
class ComplexObject {
    public a : 
}

const plain = serializer.toPlain(
    new ComplexObject({
        a: 1,
        b: '2',
        c: new Date('2020-01-01T00:00:00Z'),
        d: [1, 2, 3],
        e: { f: 4, g: 5 }
    })
);
```
