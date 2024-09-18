import { Exception } from './Exception.js';

const cache = new Map<Function, Function[]>();

export function getClassesFromChain (Source : Function) : Function[]
{
    if ([ null, undefined ].includes(Source)) {
        return [];
    }
    
    if (!(Source instanceof Function)) {
        throw new Exception(
            'Argument is not a function',
            1657540353008
        );
    }
    
    let collection : Function[] = cache.get(Source);
    if (!collection) {
        collection = [];
        
        let Class = Source;
        while (Class !== Object) {
            collection.push(Class);
            
            const Prototype = Object.getPrototypeOf(Class.prototype);
            Class = Prototype.constructor;
        }
        
        cache.set(Source, collection);
    }
    
    return [ ...collection ];
}
