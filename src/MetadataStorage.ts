import type {
    AutoGroupEntry,
    ClassConstructor,
    ExposeDscr,
    PropertyDefinition,
    TargetType,
    Transformers,
    TypeDefinition
} from './def.js';
import { Exception, getClassesFromChain } from './helpers/index.js';
import * as BuiltInTransformers from './transformers/index.js';


type TypeDefinitions = Map<any, TypeDefinition>;

type PropertyDefinitions = Map<
    any,
    Record<
        PropertyKey,
        PropertyDefinition
    >
>;

export class MetadataStorage
{
    
    protected static __singleton : MetadataStorage;
    
    public static getSingleton () : MetadataStorage
    {
        if (!this.__singleton) {
            this.__singleton = new MetadataStorage();
            
            // built in transformers
            for (const transformer of Object.values(BuiltInTransformers)) {
                transformer.register();
            }
        }
        
        return this.__singleton;
    }
    
    
    protected _types : TypeDefinitions = new Map();
    protected _typesMap : Record<string, any> = {};
    
    protected _propertiesCache : Map<any, Set<PropertyKey>> = new Map();
    protected _properties : PropertyDefinitions = new Map();
    
    
    public registerType (
        targetClass : any,
        typeDef : TypeDefinition
    )
    {
        // try to aquire type name from parent class
        if (!typeDef.name) {
            const parentClasses = getClassesFromChain(targetClass);
            for (const parentClass of parentClasses) {
                const parentTypeDef = this._types.get(parentClass);
                if (parentTypeDef?.name) {
                    const fullName = parentTypeDef.name + '/' + targetClass.name;
                    typeDef.name = fullName;
                    break;
                }
            }
        }
        
        // aquire type name from class name
        if (!typeDef.name) {
            typeDef.name = targetClass.name;
        }
        
        if (typeDef.name) {
            if (this._typesMap[typeDef.name]) {
                throw new Exception(
                    `Type with name "${typeDef.name}" already registered`,
                    1709649278876
                );
            }
            
            this._typesMap[typeDef.name] = targetClass;
        }
        
        const typeDefinition = this._initTypeDefinition(targetClass);
        Object.assign(typeDefinition, typeDef);
    }
    
    public registerIdProperty (
        targetClass : any,
        propertyKey : PropertyKey
    )
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.idProperty = propertyKey;
    }
    
    public registerAutoGroupFn (
        targetClass : any,
        autoGroupEntry : AutoGroupEntry
    )
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.autoGroups.push(autoGroupEntry);
    }
    
    public registerTypeTransformers<T = any> (
        targetClass : ClassConstructor<T>,
        transformers : Transformers<T>
    )
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        Object.assign(typeDefinition.transformers, transformers);
    }
    
    protected _initTypeDefinition (
        targetClass : any
    ) : TypeDefinition
    {
        let typeDefinition = this._types.get(targetClass);
        if (!typeDefinition) {
            typeDefinition = {
                name: undefined,
                idProperty: undefined,
                autoGroups: [],
                transformers: {},
            };
            this._types.set(targetClass, typeDefinition);
        }
        
        return typeDefinition;
    }
    
    public getTypeDefinition (
        targetClass : any
    ) : TypeDefinition
    {
        return this._types.get(targetClass);
    }
    
    public getTypeByName (
        typeName : string
    ) : any
    {
        return this._typesMap[typeName];
    }
    
    
    public registerPropertyDescriptor (
        targetClass : any,
        propKey : PropertyKey,
        descriptor : PropertyDescriptor
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        if (!propDefiniton.descriptor) {
            propDefiniton.descriptor = descriptor;
        }
    }
    
    public registerPropertyExpose (
        targetClass : any,
        propKey : PropertyKey,
        exposeDscr : ExposeDscr
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.exposeDscrs.unshift(exposeDscr);
    }
    
    public registerPropertyType (
        targetClass : any,
        propKey : PropertyKey,
        type : TargetType
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.type = type;
    }
    
    public registerPropertyTransformers (
        targetClass : any,
        propKey : PropertyKey,
        transformers : Transformers
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        Object.assign(propDefiniton.transformers, transformers);
    }
    
    protected _initPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey
    ) : PropertyDefinition
    {
        let classDefinition = this._properties.get(targetClass);
        if (!classDefinition) {
            classDefinition = {};
            this._properties.set(targetClass, classDefinition);
        }
        
        if (!classDefinition[propKey]) {
            classDefinition[propKey] = {
                exposeDscrs: [],
                type: undefined,
                transformers: {},
            };
        }
        
        // clear cache
        const hasPropertiesCache = this._propertiesCache.has(targetClass);
        if (hasPropertiesCache) {
            this._propertiesCache.delete(targetClass);
        }
        
        return classDefinition[propKey];
    }
    
    
    
    public getAllProperties (
        targetClass : any
    ) : Set<PropertyKey>
    {
        let propertiesCache = this._propertiesCache.get(targetClass);
        if (!propertiesCache) {
            // build cache
            propertiesCache = new Set<PropertyKey>();
            
            // get from instance
            if (targetClass.prototype) {
                const instance = new targetClass();
                Object.keys(instance)
                    .forEach(propKey => propertiesCache.add(propKey));
            }
            
            // get from definitons
            const classes = getClassesFromChain(targetClass);
            for (const singleClass of classes) {
                const classDefinitions = this._properties.get(singleClass);
                if (classDefinitions) {
                    Object.keys(classDefinitions)
                        .forEach(propKey => propertiesCache.add(propKey));
                }
            }
            
            this._propertiesCache.set(targetClass, propertiesCache);
        }
        
        return propertiesCache;
    }
    
    public getPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey
    ) : PropertyDefinition
    {
        const classes = getClassesFromChain(targetClass);
        
        for (const singleClass of classes) {
            const classDefinitions = this._properties.get(singleClass);
            if (!classDefinitions) {
                continue;
            }
            
            const propDefinitions = classDefinitions[propKey];
            if (propDefinitions) {
                return propDefinitions;
            }
        }
        
        return {};
    }
    
}
