import type { TargetType } from '$/def.js';

export function isIterable (obj : any) : obj is Iterable<any>
{
    return obj && typeof obj[Symbol.iterator] === 'function';
}

export function isTargetType (obj : any) : obj is TargetType
{
    return obj
        && obj.constructor === Object
        && (
            obj.type || obj.arrayOf || obj.recordOf
        );
}

export function isRestrictedAccessor (name : string) : boolean
{
    return [
        'constructor',
        '__proto__',
        'prototype',
    ].includes(name);
}
