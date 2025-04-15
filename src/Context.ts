import type { ExposeGraph, PropertyDefinition, SerializationOptions, TypeDefinition, TypeDscr } from '$/def.js';

export class Context<T = any>
{
    
    protected _backups : Context[] = [];
    protected _backupIdx? : number = 0;
    
    public options : SerializationOptions.Base<T>;
    
    public parent : any;
    public propertyKey : PropertyKey;
    public path : string = '';
    public depth : number = 0;
    
    public typeDscr : TypeDscr;
    public typeDef : TypeDefinition;
    
    public propDef : PropertyDefinition;
    
    public defaultStrategy : boolean;
    public groups : string[] = [];
    public graph : ExposeGraph<T>;
    public forceExpose : boolean = false;
    
    public circular : any[] = [];
    
    public stopProcessing : boolean = false;
    
    public data? : Record<any, any> = {};
    
    
    public constructor (options : SerializationOptions.Base<T> = {})
    {
        this.options = options;
        
        if ('path' in options) {
            this.path = options.path;
        }
        if ('graph' in options) {
            this.graph = options.graph;
        }
        if ('groups' in options) {
            this.groups = options.groups;
        }
        if ('typeDscr' in options) {
            this.typeDscr = options.typeDscr;
        }
        if ('ctxData' in options) {
            this.data = options.ctxData;
        }
    }
    
    
    public fork (fn : () => any) : void
    {
        // get existing backup object or allocate new one
        let backup : Context;
        if (this._backupIdx < this._backups.length) {
            backup = this._backups[this._backupIdx];
        }
        else {
            backup = new Context();
            this._backups.push(backup);
        }
        
        ++this._backupIdx;
        
        // store current context into backup
        // values are assigned one by one (Object.assign() is too slow)
        backup.options = this.options;
        backup.parent = this.parent;
        backup.propertyKey = this.propertyKey;
        backup.path = this.path;
        backup.depth = this.depth;
        backup.typeDscr = this.typeDscr;
        backup.typeDef = this.typeDef;
        backup.propDef = this.propDef;
        backup.defaultStrategy = this.defaultStrategy;
        backup.groups = this.groups;
        backup.graph = this.graph;
        backup.forceExpose = this.forceExpose;
        backup.circular = this.circular;
        backup.stopProcessing = this.stopProcessing;
        backup.data = this.data;
        
        // call function
        fn();
        
        // restore context from backup
        this.options = <any>backup.options;
        this.parent = backup.parent;
        this.propertyKey = backup.propertyKey;
        this.path = backup.path;
        this.depth = backup.depth;
        this.typeDscr = backup.typeDscr;
        this.typeDef = backup.typeDef;
        this.propDef = backup.propDef;
        this.defaultStrategy = backup.defaultStrategy;
        this.groups = backup.groups;
        this.graph = <any>backup.graph;
        this.forceExpose = backup.forceExpose;
        this.circular = backup.circular;
        this.stopProcessing = backup.stopProcessing;
        this.data = backup.data;
        
        --this._backupIdx;
    }
    
}
