import type { ExposeDscr } from '../def.js';
import { Registry } from '../Registry.js';


function Expose () : PropertyDecorator;
function Expose (groups : string[]) : PropertyDecorator;
function Expose (expose : ExposeDscr) : PropertyDecorator;

function Expose (...args : any[]) : PropertyDecorator
{
    let expose : ExposeDscr;
    
    if (args.length === 0) {
        expose = {
            mode: true,
        };
    }
    else if (args[0] instanceof Array) {
        expose = {
            mode: true,
            any: args[0],
        };
    }
    else {
        expose = {
            mode: true,
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

export { Expose };
