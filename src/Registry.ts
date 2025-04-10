import type { BaseTransformer } from '$/transformers/BaseTransformer.js';
import { Direction } from './def.js';
import type {
    AutoGroupEntry,
    ClassConstructor,
    ExposeRule,
    PropertyDefinition,
    PropertyModifiers,
    PropTransformerDscr,
    TransformerOptions,
    TypeDefinition,
    TypeDscr,
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
    
    
    protected _transformers : Record<Direction, BaseTransformer[]> = {
        [Direction.Serialize]: [],
        [Direction.Deserialize]: [],
    };
    protected _allTransformers : BaseTransformer[] = [];
    
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
        options? : TransformerOptions,
    ) : void
    {
        const transformer = new transformerClass();
        
        this._allTransformers.push(transformer);
        
        if (transformer.serializeOrder !== undefined) {
            this._transformers[Direction.Serialize] = [
                ...this._transformers[Direction.Serialize],
                transformer,
            ].sort((a, b) => a.serializeOrder - b.serializeOrder);
        }
        
        if (transformer.deserializeOrder !== undefined) {
            this._transformers[Direction.Deserialize] = [
                ...this._transformers[Direction.Deserialize],
                transformer,
            ].sort((a, b) => a.deserializeOrder - b.deserializeOrder);
        }
    }
    
    public registerTypeModifiers (
        targetClass : ClassConstructor,
        modifiers : TypeModifiers,
    ) : void
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.modifiers = modifiers;
    }
    
    protected _initTypeDefinition (targetClass : any) : TypeDefinition
    {
        let typeDefinition = this._types.get(targetClass);
        if (!typeDefinition) {
            const parentClasses = getClassesFromChain(targetClass, true);
            if (parentClasses[0]) {
                const parentTypeDef = this._types.get(parentClasses[0]);
                if (parentTypeDef) {
                    typeDefinition = {
                        ...parentTypeDef,
                        modifiers: { ...parentTypeDef.modifiers },
                        autoGroups: [ ...parentTypeDef.autoGroups ],
                    };
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
    
    
    protected _initPropertyDefinition (
        targetClass : any,
        propKey : PropertyKey,
        initType : boolean = true,
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
        
        if (initType && !propDef.typeDscr) {
            const designType = Reflect.getMetadata(
                'design:type',
                targetClass.prototype,
                <any>propKey,
            );
            if (designType) {
                propDef.typeDscr = { type: () => designType };
            }
        }
        
        // clear cache
        const hasPropertiesCache = this._propertiesCache.has(targetClass);
        if (hasPropertiesCache) {
            this._propertiesCache.delete(targetClass);
        }
        
        return propDef;
    }
    
    public registerIdProperty (
        targetClass : any,
        propKey : PropertyKey,
    ) : void
    {
        const typeDefinition = this._initTypeDefinition(targetClass);
        typeDefinition.idProperty = propKey;
        
        this._initPropertyDefinition(targetClass, propKey);
    }
    
    public registerPropertyDescriptor (
        targetClass : any,
        propKey : PropertyKey,
        descriptor : PropertyDescriptor,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey, false);
        propDefiniton.descriptor = descriptor;
    }
    
    public registerPropertyExpose (
        targetClass : any,
        propKey : PropertyKey,
        exposeRule : ExposeRule,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        
        if (!propDefiniton.exposeRules) {
            propDefiniton.exposeRules = [];
        }
        
        propDefiniton.exposeRules.unshift(exposeRule);
    }
    
    public registerPropertyType (
        targetClass : any,
        propKey : PropertyKey,
        typeDscr : TypeDscr,
    ) : void
    {
        const propDefiniton = this._initPropertyDefinition(targetClass, propKey);
        propDefiniton.typeDscr = typeDscr;
    }
    
    public registerPropertyTransformers (
        targetClass : any,
        propKey : PropertyKey,
        transformers : PropTransformerDscr,
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
    
    
    public getAllTransformers () : BaseTransformer[]
    {
        return this._allTransformers;
    }
    
    public getTransformers (direction : Direction) : BaseTransformer[]
    {
        return this._transformers[direction];
    }
    
    public getAllProperties (targetClass : any) : Set<PropertyKey>
    {
        let propertiesCache = this._propertiesCache.get(targetClass);
        if (!propertiesCache) {
            propertiesCache = new Set<PropertyKey>();
            
            // register instance properties
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
            typeDscr: undefined,
            exposeRules: [],
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
