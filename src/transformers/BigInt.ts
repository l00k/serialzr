import { MetadataStorage } from '../MetadataStorage.js';

export function register ()
{
    MetadataStorage.getSingleton()
        .registerTypeTransformers(<any>BigInt, {
            toPlain: {
                before: (source) => {
                    const value = source.constructor == BigInt
                        ? source.toString(10)
                        : undefined
                    ;
                    return [ value, true ];
                },
            },
            toClass: {
                before: (source) => {
                    const value = [ 'string', 'number' ].includes(typeof source)
                        ? BigInt(source)
                        : undefined
                    ;
                    return [ value, true ];
                },
            }
        });
}
