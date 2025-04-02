import { isRestrictedAccessor } from '$/helpers/common.js';
import type { BaseTransformer } from '$/transformers/BaseTransformer.js';
import clone from 'clone';
import type {
    AutoGroupEntry,
    ClassConstructor,
    ExposeDscr,
    PropertyDefinition,
    PropertyModifiers,
    PropTransformers,
    TargetType,
    TransformerOptions,
    TypeDefinition,
    TypeModifiers,
} from './def.js';
import { Exception, getClassesFromChain } from './helpers/index.js';


type TypeDefinitions = Map<any, TypeDefinition>;

type PropertyDefinitions = Map<
    any,
    Map<
        PropertyKey,
        PropertyDefinition
    >
>;

type OrderedTransformer = {
    transformer : BaseTransformer,
    order : number,
}

export class Registry
{
    
    protected static __singleton : Registry;
    
    public static getSingleton () : Registry
    {
        if (!this.__singleton) {
            this.__singleton = new Registry();
        }
        
        return this.__singleton;
    }
    
    
    protected _serializers : OrderedTransformer[] = [];
    protected _deserializers : OrderedTransformer[] = [];
    
    protected _types : TypeDefinitions = new Map();
    protected _typesMap : Record<string, any> = {};
    
    protected _properties : PropertyDefinitions = new Map();
    
    protected _propertiesCache : Map<any, Set<PropertyKey>> = new Map();
    protected _propertiesDefCache : Map<any, Record<string, PropertyDefinition>> = new Map();
    
    
    public registerType (
        targetClass : any,
        typeDef : TypeDefinition,
    ) : void
    {
        // try to aquire type name from parent class
        if (!typeDef.name) {
            let typeName = '';
            
            const parentClasses = getClassesFromChain(targetClass, true);
            if (parentClasses.length) {
                const parentTypeDef = this._types.get(parentClasses[0]);
                if (parentTypeDef?.name) {
                    typeName = parentTypeDef.name;
                }
            }
            
            typeDef.name = typeName + (typeName ? '/' : '') + targetClass.name;
        }
        
        if (this._typesMap[typeDef.name]) {
            throw new Exception(
                `Type with name "${typeDef.name}" already registered`,
                1709649278876,
            );
        }
        
        this._typesMap[typeDef.name] = targetClass;
        
        const typeDefinition = this._initTypeDefinition(targetClass);
        Object.assign(typeDefinition, typeDef);
    }
    
    public registerIdProperty (
        targetClass : any,
        propertyKey : PropertyKey,
    ) : void
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.idProperty = propertyKey;
    }
    
    public registerAutoGroupFn (
        targetClass : any,
        autoGroupEntry : AutoGroupEntry,
    ) : void
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.autoGroups.push(autoGroupEntry);
    }
    
    public registerTransformers<T extends BaseTransformer> (
        transformerClass : ClassConstructor<T>,
        options : TransformerOptions,
    ) : void
    {
        const transformer = new transformerClass();
        
        if (options.serializeOrder !== undefined) {
            this._serializers = [
                ...this._serializers,
                { transformer, order: options.serializeOrder },
            ].sort((a, b) => a.order - b.order);
        }
        if (options.deserializeOrder !== undefined) {
            this._deserializers = [
                ...this._deserializers,
                { transformer, order: options.deserializeOrder },
            ].sort((a, b) => a.order - b.order);
        }
    }
    
    public registerTypeModifiers (
        targetClass : ClassConstructor<any>,
        modifiers : TypeModifiers,
    ) : void
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.modifiers = modifiers;
    }
    
    protected _initTypeDefinition (
        targetClass : any,
    ) : TypeDefinition
    {
        let typeDefinition = this._types.get(targetClass);
        if (!typeDefinition) {
            const parentClasses = getClassesFromChain(targetClass, true);
            if (parentClasses[0]) {
                const parentTypeDef = this._types.get(parentClasses[0]);
                if (parentTypeDef) {
                    typeDefinition = clone(parentTypeDef);
                    typeDefinition.name = undefined;
                }
            }
            
            if (!typeDefinition) {
                typeDefinition = {
                    name: undefined,
                    idProperty: undefined,
                    autoGroups: [],
                    modifiers: {
                        excludePrefixes: [],
                        excludeExtraneous: undefined,
                        defaultStrategy: undefined,
                        keepInitialValues: undefined,
                    },
                };
            }
            
            this._types.set(targetClass, typeDefinition);
            
            // get defined properties from instance
            this._registerAccessors(targetClass);
            this._registerInstanceProperties(targetClass);
        }
        
        return typeDefinition;
    }
    
    public getTypeDefinition (
        targetClass : any,
    ) : TypeDefinition
    {
        return this._types.get(targetClass);
    }
    
    public getTypeByName (
        typeName : string,
    ) : any
    {
        return this._typesMap[typeName];
    }
    
    
    protected _registerAccessors (targetClass : any) : void
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
                descriptor,
            );
        }
    }
    
    protected _registerInstanceProperties (targetClass : any) : void
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
                    descriptor,
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
        descriptor : PropertyDescriptor,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.descriptor = descriptor;
    }
    
    public registerPropertyExpose (
        targetClass : any,
        propKey : PropertyKey,
        exposeDscr : ExposeDscr,
    ) : void
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
        type : TargetType,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.type = type;
    }
    
    public registerPropertyTransformers (
        targetClass : any,
        propKey : PropertyKey,
        transformers : PropTransformers,
    ) : void
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
        modifiers : PropertyModifiers,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.modifiers = modifiers;
    }
    
    protected _initPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey,
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
    
    
    public getSerializers () : OrderedTransformer[]
    {
        return this._serializers;
    }
    
    public getDeserializers () : OrderedTransformer[]
    {
        return this._deserializers;
    }
    
    public getAllProperties (
        targetClass : any,
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
        propKey : PropertyKey,
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
