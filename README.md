# Serialzr

Serialzr is a powerful TypeScript serialization/deserialization library designed for 
flexibility and control over the transformation process between complex object graphs 
and plain JavaScript objects and back into class objects.
It leverages decorators for configuration and a transformer pipeline for customizable logic.

[![NPM Version](https://img.shields.io/npm/v/serialzr)](https://www.npmjs.com/package/serialzr)
![GitHub top language](https://img.shields.io/github/languages/top/l00k/serialzr)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/l00k/serialzr/ci.yaml?branch=master)](https://github.com/l00k/serialzr/actions/workflows/ci.yaml)
[![Codecov](https://img.shields.io/codecov/c/github/l00k/serialzr)](https://app.codecov.io/gh/l00k/serialzr)

### Features

* **Decorator-Driven Configuration:** Use familiar TypeScript decorators to define how classes and properties should be handled.
* **Explicit Exposure:** Control precisely which properties are included or excluded during serialization/deserialization.
* **Type Safety:** Maintain type information during the process.
* **Extensibility:** Easily create and register custom transformation logic.
* **Advanced Features:** Handle complex scenarios like circular dependencies, conditional exposure (groups), computed properties, and depth limiting.
* Built-in support for array of objects and `Record<string, T>` maps


* ESM
* Zero dependencies
* Full TypeScript support
* Covered with tests


## Install

```bash
npm install serialzr
yarn add serialzr
```

## Table of Contents

1.  [Core Concepts](#core-concepts)
    * [Serialization & Deserialization](#serialization--deserialization)
    * [Registry](#registry)
    * [Transformers](#transformers)
    * [Decorators](#decorators)
2.  [Getting Started](#getting-started)
    * [Initialization](#initialization)
    * [Basic Usage](#basic-usage)
3.  [Core Classes](#core-classes)
    * [Serializer](#serializer-class)
    * [Registry](#registry-class)
4.  [Decorators](#decorators-detailed)
    * [`@Type`](#type-decorator)
    * [`@Expose` / `@Exclude`](#expose--exclude-decorators)
    * [`@Id`](#id-decorator)
    * [`@Modifiers`](#modifiers-decorator)
    * [`@Transformer`](#transformer-decorator)
    * [`@Computed`](#computed-decorator)
    * [`@ComputedByGroups`](#computedbygroups-decorator)
    * [`@AutoGroup`](#autogroup-decorator)
    * [`@RegisterTransformer`](#registertransformer-decorator)
5.  [Key Features & Built-in Transformers](#key-features--built-in-transformers)
    * [Type Handling](#type-handling)
    * [Grouping](#grouping)
    * [Circular Dependencies & Object Linking](#circular-dependencies--object-linking)
    * [Depth Limiting](#depth-limiting)
    * [Custom Transformers](#custom-transformers)
    * [Error Handling](#error-handling)
6.  [Serialization Options](#serialization-options)

---

## Core Concepts

### Serialization & Deserialization

* **Serialization:** The process of converting a TypeScript class instance (an object with methods, prototype chain, etc.) into a plain JavaScript object suitable for storage, transmission (e.g., JSON), or other purposes.
* **Deserialization:** The reverse process of converting a plain JavaScript object back into an instance of a specific TypeScript class, restoring its type and structure.

### Registry

The `Registry` (typically used as a singleton) stores metadata about classes and properties defined using decorators. This includes type information, exposure rules, transformer configurations, and more. The `Serializer` consults the `Registry` during processing.

### Transformers

Transformers are classes that implement specific parts of the serialization/deserialization logic. They operate in a defined order (pipeline) on the data. The library includes many built-in transformers for common tasks (handling Dates, Arrays, Objects, Circular Dependencies, etc.). You can also create and register custom transformers.

### Decorators

Decorators are used to attach metadata to classes and properties, configuring how they should be treated by the `Serializer` and `Registry`.

---

## Getting Started

### Initialization

Before using the serializer, you need to initialize it. This typically involves getting the `Registry` singleton and registering the built-in transformers. The library provides a helper function for this.

```typescript
import { Serializer } from 'serialzr'; // Adjust path as needed

// Create and initialize the Serializer instance
const serializer = new Serializer();
serializer.init({
    // Optional configuration
    // typeProperty: '@type', // Property name for type info (default)
    // objectLinkProperty: '@id', // Property name for object links (default)
    // useObjectLink: false, // Enable object linking globally (default: false)
});
```

### Basic Usage

1.  **Decorate your classes:** Use decorators like `@Type`, `@Expose`, `@Id`, etc., to define how your classes and their properties should be serialized.
2.  **Instantiate the `Serializer`:** Create an instance as shown above.
3.  **Call `serialize` or `deserialize`:** Pass your object instance and optional options.

```typescript
import { Serializer, Srlz } from 'serialzr';

// --- Class Definition ---
@Srlz.Type('User') // Register the class with a unique type name
class User {
    @Srlz.Id() // Mark 'id' as the identifier property
    @Srlz.Expose() // Expose 'id' during serialization
    public id: number;
    
    @Srlz.Expose()
    public firstName: string;
    
    @Srlz.Expose()
    public lastName: string;
    
    // This property will NOT be serialized by default unless exposeAll is true or explicitly exposed
    private internalNotes: string = 'Some notes';
    
    constructor(id: number, firstName: string, lastName: string) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

// --- Initialization (as above) ---
const serializer = new Serializer();
serializer.init();

// --- Serialization ---
const user = new User(1, 'John', 'Doe');
const plainUser = serializer.serialize(user);

console.log(plainUser);
/* Output:
{
    "@type": "User", // Added automatically if @Type() is used
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
}
*/

// --- Deserialization ---
const plainData = {
    "@type": "User",
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith"
};

const userInstance = serializer.deserialize<User>(plainData);

console.log(userInstance instanceof User); // Output: true
console.log(userInstance);
/* Output:
User {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    internalNotes: 'Some notes' // Note: internalNotes is initialized by constructor
}
*/
```
*Example structure based on general library usage patterns observed in*

---

## Core Classes

### `Serializer` Class

The main entry point for serialization and deserialization.

* `constructor()`: Creates a new Serializer instance.
* `init(options?: Options)`: Initializes the serializer and its transformers. Must be called before use. Allows setting global options like `typeProperty`, `objectLinkProperty`, and `useObjectLink`.
* `serialize<T>(source: T, options?: SerializationOptions.Serialize)`: Converts a class instance `source` into a plain object based on registered metadata and provided options.
* `deserialize<T>(source: any, options?: SerializationOptions.Deserialize)`: Converts a plain object `source` back into an instance of a specific class `T`. Requires type information (usually via `@Type` and the `typeProperty` in the source data or explicit options).
* `getTypeName(type: any)`: Gets the registered name for a given class constructor.
* `getTypeByName(typeName: string)`: Gets the class constructor associated with a registered type name.
* `buildObjectLink(source: any, type?: ClassConstructor)`: Generates an object link string (e.g., `@/User/1`) for a given object instance, requires `@Id` to be defined on the class.

### `Registry` Class

Manages all metadata collected from decorators. Usually accessed via `Registry.getSingleton()`.

* `registerType(targetClass: any, typeDef: TypeDefinition)`: Registers a class, typically called by the `@Type` decorator.
* `registerIdProperty(targetClass: any, propertyKey: PropertyKey)`: Registers the identifier property for a class, called by the `@Id` decorator.
* `registerProperty(targetClass: any, propertyKey: PropertyKey, propDef: Partial<PropertyDefinition>)`: Registers metadata for a property (type, exposure rules, transformers), called by various decorators like `@Expose`, `@Exclude`, `@Type` (on properties), `@Transformer`.
* `registerTransformers(transformerClass: ClassConstructor<BaseTransformer>)`: Registers a custom or built-in transformer class.
* `getTypeDefinition(targetClass: any)`: Retrieves the stored metadata for a registered class.
* `getPropertyDefinition(targetClass: any, propertyKey: PropertyKey)`: Retrieves the stored metadata for a specific property of a class.
* `getAllProperties(targetClass: any)`: Gets a set of all registered property keys for a class, including inherited ones.

---

## Decorators (Detailed)

### `@Type` Decorator

Used to register classes with the `Registry` and define property types.

* **On Classes:**
    * `@Type(typeName: string)`: Registers the class with a specific name. This name is used in the `typeProperty` (e.g., `@type`) during serialization/deserialization.
    * `@Type(typeDefinition: Partial<TypeDefinition>)`: Registers the class with advanced options (though `typeName` is the most common usage).

* **On Properties:**
    * `@Type(() => SomeClass)`: Specifies the type of the property, essential for deserializing nested objects or handling relationships.
    * `@Type({ arrayOf: () => SomeItemClass })`: Specifies that the property is an array of `SomeItemClass` instances.
    * `@Type({ recordOf: () => SomeValueClass })`: Specifies that the property is an object (record/map) where values are instances of `SomeValueClass`.
    * `@Type(() => Date)`: Handles `Date` objects.
    * `@Type(() => BigInt)`: Handles `BigInt` objects.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Address') // Register Address class
class Address {
    @Srlz.Expose() public street: string;
    @Srlz.Expose() public city: string;
}

@Srlz.Type('UserProfile') // Register UserProfile class
class UserProfile {
    @Srlz.Id() @Srlz.Expose() public id: number;
    
    @Srlz.Expose()
    @Srlz.Type(() => Address) // Specify type for nested object
    public primaryAddress: Address;
    
    @Srlz.Expose()
    @Srlz.Type({ arrayOf: () => Address }) // Specify type for array of objects
    public shippingAddresses: Address[];
    
    @Srlz.Expose()
    @Srlz.Type(() => Date) // Specify type for Date
    public registeredAt: Date;
    
    @Srlz.Expose()
    @Srlz.Type({ recordOf: () => String }) // Specify type for map/record
    public preferences: Record<string, string>;
}
```
*Code structure based on*

### `@Expose` / `@Exclude` Decorators

Control which properties are included or excluded during serialization/deserialization. The default behavior depends on the `defaultStrategy` modifier (defaults to excluding properties unless explicitly exposed).

* `@Expose()`: Marks a property to be included.
* `@Exclude()`: Marks a property to be excluded.
* `@Expose(options: ExposeRule)` / `@Exclude(options: ExposeRule)`: Provides fine-grained control using groups:
    * `any: string[]`: Expose/exclude if *any* of the specified groups are active during serialization.
    * `all: string[]`: Expose/exclude if *all* of the specified groups are active.
    * `notAny: string[]`: Expose/exclude if *none* of the specified groups are active.
    * `notAll: string[]`: Expose/exclude if *not all* of the specified groups are active.
* `@Expose(groups: string[])` / `@Exclude(groups: string[])`: Shortcut for `{ any: groups }`.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Product')
@Srlz.Modifiers({ defaultStrategy: Strategy.Exclude }) // Default: Exclude unless @Expose'd
class Product {
    @Srlz.Id() @Srlz.Expose() public id: string;
    
    @Srlz.Expose() public name: string;
    
    @Srlz.Expose({ any: ['admin', 'owner'] }) // Expose only for admin or owner groups
    public costPrice: number;
    
    @Srlz.Exclude({ any: ['public'] }) // Exclude if 'public' group is active
    public internalSku: string;
    
    @Srlz.Expose() public description: string;
    
    @Srlz.Exclude() // Always exclude this
    private internalProcessingNotes: string;
}

// --- Serialization with groups ---
const serializer = new Serializer();
serializer.init();

const product = new Product(...);

const publicView = serializer.serialize(product, { groups: ['public'] });
// // costPrice and internalSku would be excluded

const adminView = serializer.serialize(product, { groups: ['admin'] });
// // costPrice included, internalSku included (as 'public' group is not active)
```
*Code structure based on*

### `@Id` Decorator

Marks a property as the unique identifier for its class instance. This is crucial for:

* **Object Linking:** Creating references (`@/TypeName/idValue`) instead of embedding the full object, especially for handling circular dependencies or reducing payload size when `useObjectLink` is enabled.
* **Deserialization:** Potentially used by custom logic or transformers to fetch existing instances instead of creating new ones.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Category')
class Category {
    @Srlz.Id() // Mark 'code' as the ID
    @Srlz.Expose()
    public code: string;
    
    @Srlz.Expose()
    public name: string;
}
```

### `@Modifiers` Decorator

Applies modifications to how types or properties are handled.

* **On Classes:** `@Modifiers(options: TypeModifiers)`
    * `excludeExtraneous: boolean`: If `true`, properties present in the source object but *not* explicitly decorated with `@Expose` (or implicitly exposed by `Strategy.Expose`) will be dropped during deserialization. If `false` (default), they might be kept depending on other factors.
    * `defaultStrategy: Strategy.Expose | Strategy.Exclude`: Sets the default behavior for properties without `@Expose` or `@Exclude`. `Exclude` (default) means only exposed properties are included. `Expose` means all properties are included unless excluded.
    * `excludePrefixes: string[]`: Properties whose names start with any of these prefixes (e.g., `_`) will always be excluded.

* **On Properties:** `@Modifiers(options: PropertyModifiers)`
    * `forceRaw: boolean`: If `true`, the property's value is taken/set directly without passing through the serialization/deserialization pipeline (no type checks, no transformations).

```typescript
import { Srlz, Strategy } from 'serialzr';

@Srlz.Type('Config')
@Srlz.Modifiers({
    defaultStrategy: Strategy.Expose, // Include all properties by default
    excludeExtraneous: true, // Drop unknown properties on deserialize
    excludePrefixes: ['_internal']
})
class Config {
    @Srlz.Id() public id: string;
    public settingA: boolean;
    public settingB: number;
    
    @Srlz.Exclude() // Explicitly exclude this one
    public sensitiveToken: string;
    
    @Srlz.Modifiers({ forceRaw: true }) // Handle this property directly
    public rawJsonObject: any;
    
    private _internalFlag: boolean; // Will be excluded due to prefix
}
```

### `@Transformer` Decorator

Applies custom inline transformation logic to a property before or after the main serialization/deserialization steps for that property.

* `@Transformer({ serialize?: PropTransformerFn | PropTransformerGroup, deserialize?: PropTransformerFn | PropTransformerGroup })`:
    * `PropTransformerFn`: `(value: any, params: PropTransformerFnParams) => { output: any, final: boolean }`
        * `value`: The current value being transformed.
        * `params`: Contains `direction`, `options`, `context`.
        * `output`: The transformed value.
        * `final`: If `true`, stops further processing (including main serialization/deserialization) for this property in the current direction/hook.
    * `PropTransformerGroup`: `{ before?: PropTransformerFn, after?: PropTransformerFn }`
        * `before`: Runs *before* the standard serialization/deserialization logic for the property.
        * `after`: Runs *after* the standard logic.

* `@Transformer.Serialize(fnOrGroup)`: Shortcut for `@Transformer({ serialize: fnOrGroup })`.
* `@Transformer.Deserialize(fnOrGroup)`: Shortcut for `@Transformer({ deserialize: fnOrGroup })`.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Item')
class Item {
    @Srlz.Id() @Srlz.Expose() public id: number;
    
    @Srlz.Expose()
    @Srlz.Transformer({
        // Serialize: Convert cents to dollars string
        serialize: (value: number) => ({
            output: (value / 100).toFixed(2),
            final: true // Stop further serialization for this prop
        }),
        // Deserialize: Convert dollars string back to cents number
        deserialize: (value: string) => ({
            output: Math.round(parseFloat(value) * 100),
            final: true // Stop further deserialization for this prop
        })
    })
    public priceInCents: number;
    
    @Srlz.Expose()
    @Transformer.Serialize({
        // Add a prefix only during serialization (after standard processing)
        after: (value: string) => ({ output: `DESC: ${value}`, final: false })
    })
    public description: string;
}
```

### `@Computed` Decorator

Defines a property whose value is computed dynamically *during serialization* based on the instance's state. It uses the `@Transformer` internally. The property itself should not typically exist on the class model.

* `@Computed(getterFn: ComputedGetterFn)`:
    * `getterFn: ({ value, parent, params }) => any`:
        * `value`: The original value (usually `undefined`).
        * `parent`: The object instance being serialized.
        * `params`: Serialization parameters (`direction`, `options`, `context`).
        * *Returns*: The computed value to be serialized.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Person')
class Person {
    @Srlz.Id() @Srlz.Expose() public id: number;
    @Srlz.Expose() public firstName: string;
    @Srlz.Expose() public lastName: string;
    
    @Srlz.Expose()
    @Srlz.Computed(({ parent }) => `${parent.firstName} ${parent.lastName}`)
    public fullName: string; // This property doesn't need to exist on the class
    
    @Srlz.Expose()
    public get fullName2 (): string
    {
        return `${parent.firstName} ${parent.lastName}`;
    }
}

// --- Serialization ---
const person = new Person(1, 'Bob', 'Ross');
const plain = serializer.serialize(person);
console.log(plain);
/* Output:
{
    "@type": "Person",
    "id": 1,
    "firstName": "Bob",
    "lastName": "Ross",
    "fullName": "Bob Ross", // Computed during serialization
    "fullName2": "Bob Ross"
}
*/
```

### `@ComputedByGroups` Decorator

Similar to `@Computed`, but the computation depends on whether specific groups are active during serialization.

* `@ComputedByGroups(groups: string[], ifIncludesFn?: ComputedGetterFn, ifNotIncludesFn?: ComputedGetterFn)`:
    * `groups`: The groups to check for.
    * `ifIncludesFn`: Called if *any* of the specified `groups` are present in the serialization options. Defaults to returning `true`.
    * `ifNotIncludesFn`: Called if *none* of the specified `groups` are present. Defaults to returning `false`.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Document')
class Document {
    @Srlz.Id() @Srlz.Expose() public id: string;
    @Srlz.Expose() public title: string;
    @Srlz.Expose() public content: string;
    
    @Srlz.Expose({ any: ['audit'] }) // Only expose version history for 'audit' group
    public versionHistory: string[];
    
    @Srlz.Expose()
    @Srlz.ComputedByGroups(
        ['audit'],
        ({ parent }) => parent.versionHistory?.length ?? 0, // Calculate if 'audit' group active
        () => undefined // Return undefined otherwise
    )
    public versionCount?: number;
}

// --- Serialization ---
const doc = new Document(...);
const plainAudit = serializer.serialize(doc, { groups: ['audit'] });
// plainAudit will have versionCount: N

const plainPublic = serializer.serialize(doc, { groups: ['public'] });
// plainPublic will not have versionCount (it computes to undefined)
```

### `@AutoGroup` Decorator

Dynamically adds serialization groups to the current context based on the state of the object being serialized, *before* property exposure is calculated.

* `@AutoGroup(groups: string | string[], fn: AutoGroupFn<T>)`:
    * `groups`: The group(s) to potentially add.
    * `fn: (instance: T, context: SerializationContext.Base) => boolean`: A function that receives the instance and context. If it returns `true`, the specified `groups` are added to the current serialization context's groups.

```typescript
import { Srlz } from 'serialzr';

@Srlz.Type('Task')
@Srlz.AutoGroup('overdue', (task) => task.dueDate < new Date() && !task.isCompleted)
@Srlz.AutoGroup('urgent', (task) => task.priority > 5)
class Task {
    @Srlz.Id() @Srlz.Expose() public id: number;
    @Srlz.Expose() public title: string;
    @Srlz.Expose() public dueDate: Date;
    @Srlz.Expose() public isCompleted: boolean = false;
    @Srlz.Expose() public priority: number = 1;
    
    @Srlz.Expose({ any: ['overdue'] }) // Only expose if 'overdue' group is auto-added
    public overdueFlag: boolean = true;
    
    @Srlz.Expose({ any: ['urgent'] }) // Only expose if 'urgent' group is auto-added
    public urgentFlag: boolean = true;
}

// --- Serialization ---
const task1 = new Task(...); 
task1.dueDate = new Date('2024-01-01'); // Overdue
serializer.serialize(task1); // -> will have overdueFlag: true

const task2 = new Task(...); 
task2.priority = 7; // Urgent
serializer.serialize(task2); // -> will have urgentFlag: true

const task3 = new Task(...); // Normal
serializer.serialize(task3); // -> will have neither flag
```

### `@RegisterTransformer` Decorator

Registers a class that extends `BaseTransformer` with the `Registry`.

```typescript
import { BaseTransformer, SerializationContext, SerializationOptions } from 'serialzr';
import { Srlz } from 'serialzr';

@Srlz.RegisterTransformer() // Register this transformer class
export class CustomUpperCaseTransformer extends BaseTransformer {
    public readonly serializeOrder = -500; // Define order relative to others
    
    public preflight(input: any, context: SerializationContext.Base, options: SerializationOptions.Base): boolean {
        // Apply only to strings specified by @Srlz.Type(() => String)
        return typeof input === 'string' && context.typeDscr?.type() === String;
    }
    
    public serialize(input: string, context: SerializationContext.Serialize, options: SerializationOptions.Serialize): any {
        context.stopProcessing = true; // This transformer handles the final value
        return input.toUpperCase();
    }

  // Optionally implement deserialize
}

// --- Usage ---
// This transformer will now automatically run for string properties during serialization.
```

---

## Key Features & Built-in Transformers

The library achieves its functionality through a pipeline of transformers executed in a specific order. Key built-in transformers include:

### Type Handling

* **`@Type` Decorator:** Defines expected types for classes and properties.
* **`BuiltInTypeTransformer`:** Handles basic types like `String`, `Number`, `Boolean`.
* **`DateTransformer`:** Serializes `Date` objects (usually to ISO strings) and deserializes them back.
* **`BigIntTransformer`:** Serializes `BigInt` objects (usually to strings) and deserializes them.
* **`ArrayTransformer`:** Handles arrays, recursively serializing/deserializing items based on `@Type({ arrayOf: ... })`.
* **`RecordTransformer`:** Handles record/map objects, recursively processing values based on `@Type({ recordOf: ... })`.
* **`AutoDetectTypeTransformer`:** (Serialize) Infers the type from the object's constructor if not explicitly specified.
* **`DetectTypeFromTypePropTransformer`:** (Deserialize) Uses the `typeProperty` (e.g., `@type`) in the plain data to determine the target class.
* **`UnknownTypeTransformer` / `TrivialValueTransformer` / `NonObjectTransformer`:** Handle cases with unknown types, null/undefined values, or non-object values gracefully.

### Grouping

* **`@Expose`/`@Exclude` (with groups):** Control property visibility based on active groups.
* **`@AutoGroup`:** Dynamically add groups based on object state.
* **`@ComputedByGroups`:** Compute property values based on active groups.
* **`SerializationOptions.groups`:** Pass an array of active groups when calling `serialize` or `deserialize`.
* **`AutoGroupsTransformer`:** Internal transformer that applies `@AutoGroup` logic.

### Circular Dependencies & Object Linking

* **Problem:** Serializing objects that reference each other directly (A -> B -> A) can lead to infinite loops.
* **Solution 1: Object Linking:**
    * Requires `@Id` on relevant classes.
    * Enable via `serializer.init({ useObjectLink: true })` or `serialize(obj, { useObjectLink: true })`.
    * When a circular reference or already-seen object (in the current serialization context) is encountered, instead of the full object, a link like `{"@id": "@/User/123"}` is generated.
    * **`CircularDependencyTransformer`:** Detects cycles and outputs links or basic info if linking is off.
    * **`ObjectLinkTransformer`:** Handles serialization/deserialization of primitive values that should be represented as links (less common).
    * **`ReduceToObjectLinkTransformer`:** If linking is enabled, this can reduce already serialized complex objects down to just their link representation under certain conditions.
* **Solution 2: Depth Limiting:** Prevent infinite loops by stopping serialization beyond a certain depth (see below).

### Depth Limiting

* **Problem:** Deeply nested object graphs can result in large payloads or performance issues.
* **Solution:** Use the `depth` option during serialization.
    * `serialize(obj, { depth: N })`
    * Properties beyond the specified depth `N` will not be serialized further (usually resulting in an empty object or just the basic properties like `@type`, `@id` if applicable).
    * **`DepthLimitTransformer`:** Enforces the depth limit early in the pipeline.

### Custom Transformers

* Create a class extending `BaseTransformer`.
* Implement `preflight` (to determine if the transformer should run for the current value/context) and `serialize`/`deserialize` methods.
* Define `serializeOrder` / `deserializeOrder` to control execution position in the pipeline. Lower numbers run earlier.
* Register the transformer using `@RegisterTransformer` on the class or manually via `registry.registerTransformers(MyTransformer)`.

### Error Handling

* The library uses a custom `Exception` class for internal errors, often providing an error code. You may want to wrap `serialize`/`deserialize` calls in `try...catch` blocks.

```typescript
import { Exception } from 'serialzr'; // Adjust path

try {
    const result = serializer.serialize(someObject);
    // ... process result
} catch (error) {
    if (error instanceof Exception) {
        console.error(`Serialzr Error (Code: ${error.code}): ${error.message}`);
    } else {
        console.error('An unexpected error occurred:', error);
    }
}
```

---

## Serialization Options

Options can be passed as the second argument to `serializer.serialize()` and `serializer.deserialize()` to customize the transformation process for that specific call. These options often override or supplement the configurations set by decorators.

### Common Options (Serialize & Deserialize)

* **`groups?: string[]`**
    * **Description:** An array of strings representing the active serialization groups. These groups are checked against the `any`, `all`, `notAny`, and `notAll` conditions defined in `@Expose` and `@Exclude` decorators to determine property visibility. They are also used by `@ComputedByGroups` and checked by `@AutoGroup`.
    * **Example:** `groups: ['user', 'admin']` - Will activate rules defined for the 'user' OR 'admin' groups.

* **`excludePrefixes?: string[]`**
    * **Description:** An array of string prefixes. Properties whose names start with any of these prefixes will be excluded from the output (serialization) or ignored during input processing (deserialization). This supplements any prefixes defined in class-level `@Modifiers`.
    * **Example:** `excludePrefixes: ['__internal', 'temp_']`

* **`defaultStrategy?: Strategy.Expose | Strategy.Exclude`**
    * **Description:** Overrides the default exposure strategy defined by `@Modifiers({ defaultStrategy: ... })` on the class for this specific call. `Strategy.Exclude` means properties must be explicitly marked with `@Expose` (or match group rules) to be included. `Strategy.Expose` means all properties are included unless explicitly marked with `@Exclude`.
    * **Default:** Inherits from class `@Modifiers` (which defaults to `Strategy.Exclude`).

* **`useObjectLink?: boolean`**
    * **Description:** Enables or disables object linking for this specific call, overriding the global setting from `serializer.init()`. When `true`, and an object with an `@Id` is encountered again within the same serialization context (or constitutes a circular reference), a link object (`{ "@id": "@/TypeName/idValue" }`) is generated instead of the full object. Requires `@Id` to be defined on the relevant classes.
    * **Default:** Inherits from `serializer.init()` (which defaults to `false`).

* **`typeProperty?: string`**
    * **Description:** Overrides the globally configured property name (default: `'@type'`) used for storing type information during serialization and reading it during deserialization. Essential for the deserializer to know which class to instantiate.
    * **Default:** Inherits from `serializer.init()` (which defaults to `'@type'`).

* **`objectLinkProperty?: string`**
    * **Description:** Overrides the globally configured property name (default: `'@id'`) used for the key within object link references generated when `useObjectLink` is enabled.
    * **Default:** Inherits from `serializer.init()` (which defaults to `'@id'`).

* **`ctxData?: any`**
    * **Description:** Allows passing arbitrary user-defined data down through the serialization/deserialization process. This data is accessible within custom transformers (`BaseTransformer`), computed property functions (`@Computed`, `@ComputedByGroups`), and inline transformers (`@Transformer`) via the `context.data` property in their parameters.
    * **Example:** `ctxData: { userId: 'current-user-id', locale: 'en-US' }`

* **`graph?: ExposeGraph<T> | '*' | '**' | boolean`**
    * **Description:** Provides fine-grained, explicit control over which properties and sub-properties are included, overriding group-based (`@Expose`/`@Exclude`) logic. It defines a "shape" for the desired output.
        * `boolean`: If `true`, attempts to include all exposed properties (similar to default behavior without a graph). If `false`, the property/object is excluded entirely (useful for pruning branches in nested graphs).
        * `string`: `'*'` Allows all fields from first level object, `'**'` exposes all fields deeply from all nested objects 
        * `ExposeGraph<T>`: An object where keys correspond to property names of the class `T`.
                
    * **Example:**
        ```typescript
        class User { id: number; name: string; profile: Profile; posts: Post[] }
        class Profile { bio: string; avatarUrl: string; }
        class Post { title: string; content: string; }

        const userGraph: ExposeGraph<User> = {
            id: true,        // Include user ID
            name: true,      // Include user name
            profile: {       // For the 'profile' property:
                avatarUrl: true // Only include the avatarUrl, exclude bio
            },
            posts: '*',      // Include all from posts
            // Properties not mentioned (like profile.bio) are excluded
        };

        serializer.serialize(user, { graph: userGraph });
        ```

### Serialize-Only Options

* **`depth?: number`**
    * **Description:** Sets the maximum depth for object traversal during serialization. Properties nested deeper than this limit will not be serialized further. This helps prevent excessive recursion or overly large outputs, especially with complex object graphs or when object linking is disabled. The value at the depth limit might be an empty object or a basic representation depending on transformers.
    * **Example:** `depth: 2` - Will serialize the root object (depth 0), its direct properties (depth 1), and their direct properties (depth 2), but nothing further down.

### Deserialize-Only Options

* **`type?: ClassConstructor | string`**
    * **Description:** Allows providing constructor of target class `T` into which the plain source data should be deserialized. You can also specify name of type.
    * **Example:**
        ```typescript
        const updatedData = { id: 1, firstName: 'New' };
        serializer.deserialize(updatedData, { type: User });
        // return object of User which now has firstName: 'New', lastName: 'Name'
        ```

* **`typeDscr?: TypeDscr`**
    * **Description:** Alternative way to specify target type. With possiblity to specify `arrayOf` | `recordOf`
    * **Example:**
        ```typescript
        const data = { id: 1, firstName: 'New' };
        serializer.deserialize([ data, data ] { 
            typeDscr: { arrayOf: () => User }
        });
        // return object of User which now has firstName: 'New', lastName: 'Name'
        ```
