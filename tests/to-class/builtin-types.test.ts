import { prepareSerializerContext } from '#/test-helper.js';
import { serializer } from '$/index.js';

prepareSerializerContext('ToClass / Built-in types', () => {
    const examples = [
        {
            name: 'undefined',
            value: undefined,
            expected: undefined
        },
        {
            name: 'null',
            value: null,
            expected: null
        },
        {
            name: 'false',
            value: false,
            expected: false
        },
        {
            name: 'true',
            value: true,
            expected: true
        },
        {
            name: 'false typed',
            type: Boolean,
            value: 'false',
            expected: false
        },
        {
            name: 'true typed',
            type: Boolean,
            value: 'true',
            expected: true
        },
        {
            name: 'true typed',
            type: Boolean,
            value: 0,
            expected: false
        },
        {
            name: 'number 0',
            value: 0,
            expected: 0
        },
        {
            name: 'number 123',
            value: 123,
            expected: 123
        },
        {
            name: 'number typed',
            type: Number,
            value: '123',
            expected: 123
        },
        {
            name: 'empty string',
            value: '',
            expected: ''
        },
        {
            name: 'string',
            value: 'text',
            expected: 'text'
        },
        {
            name: 'Date by number',
            value: 1710031830201,
            expected: new Date(1710031830201),
            type: Date,
            cmp: (a, b) => a.toISOString() === b.toISOString(),
        },
        {
            name: 'Date by date string',
            value: '2024-03-10T00:50:30.201Z',
            expected: new Date(1710031830201),
            type: Date,
            cmp: (a, b) => a.toISOString() === b.toISOString(),
        },
        {
            name: 'Date - invalid',
            value: true,
            expected: undefined,
            type: Date,
        },
        {
            name: 'BigInt by number',
            value: 1710031830201,
            expected: BigInt('1710031830201'),
            type: BigInt,
            cmp: (a, b) => a.toString() === b.toString(),
        },
        {
            name: 'BigInt by string',
            value: '17100318302011710275780440',
            expected: BigInt('17100318302011710275780440'),
            type: BigInt,
            cmp: (a, b) => a.toString() === b.toString(),
        },
        {
            name: 'BigInt - invalid',
            value: true,
            expected: undefined,
            type: BigInt,
        },
        {
            name: 'array of strings',
            value: [ 'text1', 'text2' ],
            expected: [ 'text1', 'text2' ]
        },
        {
            name: 'wrong array of strings',
            value: false,
            expected: [],
            type: { arrayOf: () => undefined },
        },
        {
            name: 'record of strings',
            value: { a: 'text1', b: 'text2' },
            expected: { a: 'text1', b: 'text2' },
            type: { recordOf: () => undefined }
        },
        {
            name: 'wrong record of strings',
            value: false,
            expected: undefined,
            type: { recordOf: () => undefined }
        },
    ];
    
    for (const example of examples) {
        it(example.name, () => {
            const target = serializer.toClass(example.value, {
                type: <any>example.type,
            });
            
            if (example.cmp) {
                expect(example.cmp(example.expected, target)).to.equal(true);
            }
            else {
                expect(target).to.deep.equal(example.expected);
            }
        });
    }
});
