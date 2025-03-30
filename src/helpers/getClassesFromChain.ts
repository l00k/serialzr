import { Exception } from './Exception.js';

type AnyFn<T = void> = (...args : any[]) => T;

const cache = new Map<AnyFn, AnyFn[]>();
const cacheOP = new Map<AnyFn, AnyFn[]>();

export function getClassesFromChain (
    Source : AnyFn,
    onlyParents : boolean = false,
) : AnyFn[]
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
    const collection : AnyFn[] = onlyParents
        ? cacheOP.get(Source)
        : cache.get(Source)
    ;
    
    return [ ...collection ];
}
