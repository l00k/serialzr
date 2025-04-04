import type { TransformerOptions } from '../def.js';
import { Registry } from '../Registry.js';


export function RegisterTransformer (options : Partial<TransformerOptions> = {}) : ClassDecorator
{
    return (target : any) => {
        const registry = Registry.getSingleton();
        
        registry.registerTransformers(
            target,
            options,
        );
    };
}
