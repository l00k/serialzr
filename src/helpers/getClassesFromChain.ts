import { Exception } from './Exception.js';

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
    
    const collection = [];
    
    let Class = Source;
    while (Class !== Object) {
        collection.push(Class);
        
        const Prototype = Object.getPrototypeOf(Class.prototype);
        Class = Prototype.constructor;
    }
    
    return collection;
}
