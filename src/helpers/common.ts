export function isIterable (obj : any) : obj is Iterable<any>
{
    return obj && typeof obj[Symbol.iterator] === 'function';
}
