import { Exception } from './Exception.js';

const cache = new Map<any, any[]>();
const cacheOP = new Map<any, any[]>();

export function getClassesFromChain (
    Source : any,
    onlyParents : boolean = false,
) : any[]
{
    if ([ null, undefined ].includes(<any>Source)) {
        return [];
    }
    
    if (!(Source instanceof Function)) {
        throw new Exception(
            'Argument is not a function',
            1657540353008,
        );
    }
    
    if (Source === Object) {
        return [];
    }
    
    const isCached = onlyParents
        ? cacheOP.has(Source)
        : cache.has(Source)
    ;
    
    if (!isCached) {
        const collection = [];
        
        let Class = Source;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const Prototype = Object.getPrototypeOf(Class.prototype);
            Class = Prototype.constructor;
            
            if (Class === Object) {
                break;
            }
            
            collection.push(Class);
        }
        
        cacheOP.set(Source, collection);
        cache.set(Source, [ Source, ...collection ]);
    }
    
    // return copy
    const collection = onlyParents
        ? cacheOP.get(Source)
        : cache.get(Source)
    ;
    
    return [ ...collection ];
}
