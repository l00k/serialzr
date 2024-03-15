import { MetadataStorage } from '../MetadataStorage.js';

export function register ()
{
    MetadataStorage.getSingleton()
        .registerTypeTransformers(Date, {
            toPlain: {
                before: (source) => {
                    const value = source instanceof Date
                        ? source.toISOString()
                        : undefined
                    ;
                    return [ value, true ];
                },
            },
            toClass: {
                before: (source) => {
                    const value = [ 'string', 'number' ].includes(typeof source)
                        ? new Date(source)
                        : undefined
                    ;
                    return [ value, true ];
                },
            }
        });
};
