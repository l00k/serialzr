import type { Context } from '$/Context.js';
import type { ObjectLinkProcessor } from '$/ObjectLinkProcessor.js';
import type { Registry } from '$/Registry.js';
import type { Serializer } from '$/Serializer.js';


export abstract class BaseTransformer
{
    
    public readonly serializeOrder : number;
    public readonly deserializeOrder : number;
    
    
    protected _serializer : Serializer;
    protected _registry : Registry;
    protected _objectLinkProcessor : ObjectLinkProcessor;
    
    
    public init (serializer : Serializer) : void
    {
        this._serializer = serializer;
        this._registry = serializer.getRegistry();
        this._objectLinkProcessor = serializer.getObjectLinkProcessor();
    }
    
    
    public preflight (
        input : any,
        context : Context,
    ) : boolean
    {
        return false;
    }
    
    public serialize (
        input : any,
        context : Context,
    ) : any
    {
        return input;
    }
    
    public deserialize (
        input : any,
        context : Context,
    ) : any
    {
        return input;
    }
    
}
