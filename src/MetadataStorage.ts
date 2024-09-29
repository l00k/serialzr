import { isRestrictedAccessor } from '$/helpers/common.js';
import type {
    AutoGroupEntry,
    ClassConstructor,
    ExposeDscr,
    PropertyDefinition, PropertyModifiers,
    TargetType,
    Transformers,
    TypeDefinition,
    TypeModifiers
} from './def.js';
import { Exception, getClassesFromChain } from './helpers/index.js';
import * as BuiltInTransformers from './transformers/index.js';


type TypeDefinitions = Map<any, TypeDefinition>;

type PropertyDefinitions = Map<
    any,
    Map<
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
    
    protected _properties : PropertyDefinitions = new Map();
    
    protected _propertiesCache : Map<any, Set<PropertyKey>> = new Map();
    protected _propertiesDefCache : Map<any, Record<string, PropertyDefinition>> = new Map();
    
    
    public registerType (
        targetClass : any,
        typeDef : TypeDefinition
    )
    {
        // try to aquire type name from parent class
        if (!typeDef.name) {
            let typeName = null;
            
            const parentClasses = getClassesFromChain(targetClass);
            for (const parentClass of parentClasses) {
                const parentTypeDef = this._types.get(parentClass);
                if (parentTypeDef?.name) {
                    typeName = parentTypeDef.name + '/' + targetClass.name;
                    break;
                }
            }
            
            if (!typeName) {
                typeName = targetClass.name;
            }
            
            typeDef.name = typeName;
        }
        
        if (this._typesMap[typeDef.name]) {
            throw new Exception(
                `Type with name "${typeDef.name}" already registered`,
                1709649278876
            );
        }
        
        this._typesMap[typeDef.name] = targetClass;
        
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
    
    public registerTypeModifiers (
        targetClass : ClassConstructor<any>,
        modifiers : TypeModifiers
    )
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.modifiers = modifiers;
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
                modifiers: {
                    excludePrefixes: [],
                    excludeExtraneous: true,
                    defaultStrategy: undefined,
                    keepInitialValues: true,
                }
            };
            this._types.set(targetClass, typeDefinition);
            
            // get defined properties from instance
            this._registerAccessors(targetClass);
            this._registerInstanceProperties(targetClass);
        }
        
        return typeDefinition;
    }
    
    public getTypeDefinition (
        targetClass : any
    ) : TypeDefinition
    {
        const classes = getClassesFromChain(targetClass);
        
        let typeDef = null;
        for (const klass of classes.reverse()) {
            const klassTypeDef = this._types.get(klass);
            if (klassTypeDef) {
                if (!typeDef) {
                    typeDef = {};
                }
                
                Object.assign(typeDef, klassTypeDef);
            }
        }
        
        return typeDef;
    }
    
    public getTypeByName (
        typeName : string
    ) : any
    {
        return this._typesMap[typeName];
    }
    
    
    protected _registerAccessors (targetClass : any)
    {
        const accessors = Object.getOwnPropertyDescriptors(targetClass.prototype);
        for (const [ propKey, descriptor ] of Object.entries(accessors)) {
            if (
                isRestrictedAccessor(propKey)
                || (!descriptor.get && !descriptor.set)
                || !descriptor.enumerable
            ) {
                continue;
            }
            
            this.registerPropertyDescriptor(
                targetClass,
                propKey,
                descriptor
            );
        }
    }
    
    protected _registerInstanceProperties (targetClass : any)
    {
        // instance properties
        try {
            const instance = new targetClass();
            const instanceProps = Object.getOwnPropertyDescriptors(instance);
            for (const [ propKey, descriptor ] of Object.entries(instanceProps)) {
                if (!descriptor.enumerable) {
                    continue;
                }
            
                this.registerPropertyDescriptor(
                    targetClass,
                    propKey,
                    descriptor
                );
            }
        }
        catch (e) {
            // ignore
        }
    }
    
    
    public registerPropertyDescriptor (
        targetClass : any,
        propKey : PropertyKey,
        descriptor : PropertyDescriptor
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.descriptor = descriptor;
    }
    
    public registerPropertyExpose (
        targetClass : any,
        propKey : PropertyKey,
        exposeDscr : ExposeDscr
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        
        if (!propDefiniton.exposeDscrs) {
            propDefiniton.exposeDscrs = [];
        }
        
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
        
        if (!propDefiniton.transformers) {
            propDefiniton.transformers = {};
        }
        
        Object.assign(propDefiniton.transformers, transformers);
    }
    
    public registerPropertyModifiers (
        targetClass : any,
        propKey : PropertyKey,
        modifiers : PropertyModifiers
    )
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.modifiers = modifiers;
    }
    
    protected _initPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey
    ) : PropertyDefinition
    {
        let classDefinition = this._properties.get(targetClass);
        if (!classDefinition) {
            classDefinition = new Map();
            this._properties.set(targetClass, classDefinition);
        }
        
        let propDef = classDefinition.get(propKey);
        if (!propDef) {
            propDef = {};
            classDefinition.set(propKey, propDef);
        }
        
        // clear cache
        const hasPropertiesCache = this._propertiesCache.has(targetClass);
        if (hasPropertiesCache) {
            this._propertiesCache.delete(targetClass);
        }
        
        return propDef;
    }
    
    
    
    public getAllProperties (
        targetClass : any
    ) : Set<PropertyKey>
    {
        let propertiesCache = this._propertiesCache.get(targetClass);
        if (!propertiesCache) {
            propertiesCache = new Set<PropertyKey>();
            
            // register instance properties
            this._registerAccessors(targetClass);
            this._registerInstanceProperties(targetClass);
            
            const classes = getClassesFromChain(targetClass);
            
            for (const singleClass of classes.reverse()) {
                const classDefinitions = this._properties.get(singleClass);
                if (classDefinitions) {
                    [ ...classDefinitions.keys() ]
                        .forEach(propKey => propertiesCache.add(propKey));
                }
            }
            
            this._propertiesCache.set(targetClass, propertiesCache);
        }
        
        return new Set(propertiesCache.values());
    }
    
    public getPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey
    ) : PropertyDefinition
    {
        let classPropDefCache = this._propertiesDefCache.get(targetClass);
        if (!classPropDefCache) {
            classPropDefCache = {};
            this._propertiesDefCache.set(targetClass, classPropDefCache);
        }
    
        if (classPropDefCache[<any>propKey]) {
            return classPropDefCache[<any>propKey];
        }
    
        const classes = getClassesFromChain(targetClass);
        
        const propDef : PropertyDefinition = {
            descriptor: undefined,
            type: undefined,
            exposeDscrs: [],
            transformers: {},
            modifiers: {},
        };
        for (const singleClass of classes.reverse()) {
            const classDefinitions = this._properties.get(singleClass);
            if (!classDefinitions) {
                continue;
            }
            
            const lvlPropDef = classDefinitions.get(propKey);
            if (lvlPropDef) {
                Object.assign(propDef, lvlPropDef);
            }
        }
        
        classPropDefCache[<any>propKey] = propDef;
        
        return propDef;
    }
    
}
