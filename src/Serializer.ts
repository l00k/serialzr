import { Context } from '$/Context.js';
import { Direction } from './def.js';
import type { SerializationOptions } from './def.js';
import { Exception } from './helpers/index.js';
import { ObjectLinkProcessor } from './ObjectLinkProcessor.js';
import { Registry } from './Registry.js';


type Options = {
    typeProperty? : string;
    objectLinkProperty? : string,
    useObjectLink? : boolean,
    objectLinkProcessor? : ObjectLinkProcessor,
}


export class Serializer
{
    
    protected _registry : Registry = Registry.getSingleton();
    
    protected _typeProperty : string = '@type';
    protected _objectLinkProperty : string = '@id';
    protected _useObjectLink : boolean = false;
    protected _objectLinkProcessor : ObjectLinkProcessor = new ObjectLinkProcessor();
    
    protected _initiated : boolean = false;
    
    
    public init (options : Options = {}) : void
    {
        if (this._initiated) {
            throw new Exception(
                'Serializer already initiated',
                1709577709189,
            );
        }
        
        if ('typeProperty' in options) {
            this._typeProperty = options.typeProperty;
        }
        if ('objectLinkProperty' in options) {
            this._objectLinkProperty = options.objectLinkProperty;
        }
        if ('useObjectLink' in options) {
            this._useObjectLink = options.useObjectLink;
        }
        if ('objectLinkProcessor' in options) {
            this._objectLinkProcessor = options.objectLinkProcessor;
        }
        
        // init transformers
        const transformers = this._registry.getAllTransformers();
        for (const transformer of transformers) {
            transformer.init(this);
        }
        
        this._initiated = true;
    }
    
    
    public getRegistry () : Registry
    {
        return this._registry;
    }
    
    public getObjectLinkProcessor () : ObjectLinkProcessor
    {
        return this._objectLinkProcessor;
    }
    
    public getTypeName (type : any) : any
    {
        const typeDef = this._registry.getTypeDefinition(type);
        if (!typeDef) {
            throw new Exception(
                'Unknown type: ' + type.name,
                1710478992800,
            );
        }
        
        return typeDef?.name;
    }
    
    public getTypeByName (typeName : string) : any
    {
        const type = this._registry.getTypeByName(typeName);
        if (!type) {
            throw new Exception(
                'Unknown type name: ' + typeName,
                1710479570120,
            );
        }
        
        return type;
    }
    
    
    public serialize<T> (
        source : T,
        options : SerializationOptions.Serialize<T> = {},
    ) : any
    {
        // prepare options
        options = {
            defaultStrategy: false,
            excludePrefixes: [],
            excludeExtraneous: true,
            
            typeProperty: this._typeProperty,
            objectLinkProperty: this._objectLinkProperty,
            useObjectLink: this._useObjectLink,
            
            ...options,
        };
        
        // move props into context
        const context = new Context(options);
        
        return this._serializeInternal(source, context);
    }
    
    public _serializeInternal<T> (
        source : T,
        context : Context,
    ) : any
    {
        const transformers = this._registry.getTransformers(Direction.Serialize);
        
        let currentValue = source;
        
        for (const transformer of transformers) {
            const shouldApply = transformer.preflight(
                currentValue,
                context,
            );
            if (!shouldApply) {
                continue;
            }
            
            currentValue = transformer.serialize(
                currentValue,
                context,
            );
            
            if (context.stopProcessing) {
                break;
            }
        }
        
        return currentValue;
    }
    
    
    public deserialize<T> (
        source : any,
        options : SerializationOptions.Deserialize<T>,
    ) : T
    {
        // prepare options
        options = {
            defaultStrategy: false,
            excludePrefixes: [],
            excludeExtraneous: true,
            keepInitialValues: true,
            
            typeProperty: this._typeProperty,
            objectLinkProperty: this._objectLinkProperty,
            useObjectLink: this._useObjectLink,
            
            ...options,
        };
        
        if (options.type) {
            if (typeof options.type == 'string') {
                const type = this._registry.getTypeByName(options.type);
                if (!type) {
                    throw new Exception(
                        'Unknown type name: ' + options.type,
                        1710478811512,
                    );
                }
                
                options.typeDscr = { type: () => type };
            }
            else {
                const type = options.type;
                options.typeDscr = { type: () => type };
            }
        }
        
        const context = new Context(options);
        
        return this._deserializeInternal(source, context);
    }
    
    public _deserializeInternal<T> (
        source : any,
        context : Context,
    ) : T
    {
        const transformers = this._registry.getTransformers(Direction.Deserialize);
        
        let currentValue = source;
        
        for (const transformer of transformers) {
            const shouldApply = transformer.preflight(
                currentValue,
                context,
            );
            if (!shouldApply) {
                continue;
            }
            
            currentValue = transformer.deserialize(
                currentValue,
                context,
            );
            
            if (context.stopProcessing) {
                break;
            }
        }
        
        return currentValue;
    }
    
}
