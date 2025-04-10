import type { Context } from '$/Context.js';
import type { ExposeGraph, RecursivePartial } from '$/def.js';


export type ExpositionResult = boolean | {
    expose : boolean,
    forceExpose? : boolean,
    ctxMod? : RecursivePartial<Context>,
}


export function testExpositionByGraph (graph : ExposeGraph) : ExpositionResult
{
    if (graph === true || graph === false) {
        return graph;
    }
    else if (typeof graph === 'number') {
        return graph > 0
            ? undefined // not specifically expose - maybe altered by rules
            : false;
    }
    else if (graph === '*') {
        return undefined; // not specifically expose - maybe altered by rules
    }
    else if (graph === '**') {
        return undefined; // not specifically expose - maybe altered by rules
    }
    else if (typeof graph === 'object') {
        return {
            expose: true,
            forceExpose: !!graph.$forceExpose,
            ctxMod: <any>graph.$ctxMod,
        };
    }
    
    return false;
}

export function getChildExpositionGraph (
    graph : ExposeGraph,
    propertyKey? : PropertyKey,
) : ExposeGraph
{
    if (graph === true || graph === false) {
        return false;
    }
    else if (typeof graph === 'number') {
        return graph - 1;
    }
    else if (graph === '*') {
        return 1;
    }
    else if (graph === '**') {
        return '**';
    }
    else if (typeof graph === 'object') {
        if (propertyKey in graph) {
            return graph[propertyKey];
        }
        else if ('$default' in graph) {
            return getChildExpositionGraphFromDefault(graph.$default);
        }
    }
    
    return false;
}

export function getChildExpositionGraphFromDefault (graph : ExposeGraph) : ExposeGraph
{
    if (graph === true) {
        return 1;
    }
    else if (graph === false) {
        return false;
    }
    else if (typeof graph === 'number') {
        return graph;
    }
    else if (graph === '*') {
        return '*';
    }
    else if (graph === '**') {
        return '**';
    }
    else if (typeof graph === 'object') {
        return graph.$expose ?? false;
    }
    
    return false;
}
