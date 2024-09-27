import type { ExposeDscr } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';


function Expose () : PropertyDecorator;
function Expose (groups : string[]) : PropertyDecorator;
function Expose (expose : ExposeDscr) : PropertyDecorator;

function Expose (...args : any[]) : PropertyDecorator
{
    let expose : ExposeDscr;
    
    if (args.length === 0) {
        expose = {
            mode: true
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
        
        const metadataStorage = MetadataStorage.getSingleton();
        
        if (descriptor) {
            metadataStorage
                .registerPropertyDescriptor(
                    constructor,
                    propertyKey,
                    descriptor
                );
        }
        
        metadataStorage
            .registerPropertyExpose(
                constructor,
                propertyKey,
                expose
            );
    };
}

export { Expose };
