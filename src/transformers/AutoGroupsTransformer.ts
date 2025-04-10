import type { Context } from '$/Context.js';
import { BaseTransformer } from './BaseTransformer.js';


export class AutoGroupsTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -500;
    public readonly deserializeOrder : number = -500;
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        if (context.typeDef?.autoGroups) {
            for (const autoGroupEntry of context.typeDef.autoGroups) {
                const pass = autoGroupEntry.fn(input, context.data, context);
                if (pass) {
                    // update current branch options
                    context.groups = [
                        ...context.groups,
                        ...autoGroupEntry.groups,
                    ];
                }
            }
        }
        
        return false;
    }
    
}
