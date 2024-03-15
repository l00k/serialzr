import type { ExposeDscr } from '../def.js';
import { MetadataStorage } from '../MetadataStorage.js';


function Exclude () : PropertyDecorator;
function Exclude (groups : string[]) : PropertyDecorator;
function Exclude (expose : ExposeDscr) : PropertyDecorator;

function Exclude () : PropertyDecorator
{
    let expose : ExposeDscr;
    
    if (arguments.length === 0) {
        expose = {
            mode: false
        };
    }
    else if (arguments[0] instanceof Array) {
        expose = {
            mode: false,
            any: arguments[0],
        };
    }
    else {
        expose = {
            mode: false,
            ...arguments[0],
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

export { Exclude };
