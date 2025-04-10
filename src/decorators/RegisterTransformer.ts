import { Registry } from '../Registry.js';


export function RegisterTransformer () : ClassDecorator
{
    return (target : any) => {
        const registry = Registry.getSingleton();
        
        registry.registerTransformers(target);
    };
}
