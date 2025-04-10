import type { ExposeRule } from '../def.js';
import { Registry } from '../Registry.js';


function Exclude () : PropertyDecorator;
function Exclude (groups : string[]) : PropertyDecorator;
function Exclude (expose : ExposeRule) : PropertyDecorator;

function Exclude (...args : any[]) : PropertyDecorator
{
    let expose : ExposeRule;
    
    if (args.length === 0) {
        expose = {
            expose: false,
        };
    }
    else if (args[0] instanceof Array) {
        expose = {
            expose: false,
            any: args[0],
        };
    }
    else {
        expose = {
            expose: false,
            ...args[0],
        };
    }
    
    return (target : any, propertyKey : PropertyKey, descriptor? : PropertyDescriptor) => {
        const constructor = target.constructor;
        
        const registry = Registry.getSingleton();
        
        if (descriptor) {
            registry.registerPropertyDescriptor(
                constructor,
                propertyKey,
                descriptor,
            );
        }
        
        registry.registerPropertyExpose(
            constructor,
            propertyKey,
            expose,
        );
    };
}

export { Exclude };
