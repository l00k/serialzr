import { prepareSerializerContext } from '#/test-helper.js';
import { serializer } from '$/index.js';

prepareSerializerContext('ToPlain / Built-in types', () => {
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
            name: 'Date',
            value: new Date(1710031830201),
            expected: '2024-03-10T00:50:30.201Z'
        },
        {
            name: 'BigInt',
            value: BigInt('17100318302011710275780440'),
            expected: '17100318302011710275780440',
        },
        {
            name: 'array of strings',
            value: [ 'text1', 'text2' ],
            expected: [ 'text1', 'text2' ]
        },
        {
            name: 'record of strings',
            value: { a: 'text1', b: 'text2' },
            expected: { a: 'text1', b: 'text2' },
            type: { recordOf: () => undefined }
        },
    ];
    
    for (const example of examples) {
        it(example.name, () => {
            const plain = serializer.toPlain(example.value, {
                type: <any>example.type
            });
            expect(plain).to.deep.equal(example.expected);
        });
    }
});
