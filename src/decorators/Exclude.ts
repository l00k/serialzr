import type { ExposeDscr } from '../def.js';
import { Registry } from '../Registry.js';


function Exclude () : PropertyDecorator;
function Exclude (groups : string[]) : PropertyDecorator;
function Exclude (expose : ExposeDscr) : PropertyDecorator;

function Exclude (...args : any[]) : PropertyDecorator
{
    let expose : ExposeDscr;
    
    if (args.length === 0) {
        expose = {
            mode: false,
        };
    }
    else if (args[0] instanceof Array) {
        expose = {
            mode: false,
            any: args[0],
        };
    }
    else {
        expose = {
            mode: false,
            ...args[0],
        };
    }
    
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        const constructor = target.constructor;
        
        const registry = Registry.getSingleton();
        
        if (descriptor) {
            registry
                .registerPropertyDescriptor(
                    constructor,
                    propertyKey,
                    descriptor,
                );
        }
        
        registry
            .registerPropertyExpose(
                constructor,
                propertyKey,
                expose,
            );
    };
}

export { Exclude };
