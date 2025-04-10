import type { Context } from '$/Context.js';
import type { ExposeRule } from '$/def.js';
import type { ExpositionResult } from '$/helpers/index.js';
import { testExpositionByGraph } from '$/helpers/index.js';
import { BaseTransformer } from './BaseTransformer.js';


export class ExpositionTransformer extends BaseTransformer
{
    
    public readonly serializeOrder : number = -800;
    public readonly deserializeOrder : number = -800;
    
    
    public preflight (input : any, context : Context) : boolean
    {
        return true;
    }
    
    public serialize (input : any, context : Context) : any
    {
        return this._process(input, context);
    }
    
    public deserialize (input : any, context : Context) : any
    {
        return this._process(input, context);
    }
    
    
    protected _process (
        input : any,
        context : Context,
    ) : any
    {
        const expose = this._processInternal(input, context);
        if (expose) {
            return input;
        }
        else {
            context.stopProcessing = true;
            return undefined;
        }
    }
    
    protected _processInternal (
        input : any,
        context : Context,
    ) : boolean
    {
        // test by depth limit
        if (
            context.options.maxDepth !== undefined
            && context.depth > context.options.maxDepth
        ) {
            return false;
        }
        
        // exclude by prefixes
        if (context.propertyKey) {
            const excludePrefixes = [
                ...context.options.excludePrefixes,
                ...(context.typeDef?.modifiers.excludePrefixes ?? []),
            ];
            
            for (const prefix of excludePrefixes) {
                if (context.propertyKey.toString().startsWith(prefix)) {
                    return false;
                }
            }
        }
        
        // forced expose is final
        if (context.forceExpose) {
            return true;
        }
        
        const defaultExposure = context.defaultStrategy
            ?? context.options.defaultStrategy
        ;
        
        // use graph if provided
        if (context.graph !== undefined) {
            const graphResult = testExpositionByGraph(context.graph);
            
            // if graphResult.expose is defined - that is the final result
            // otherwise it may be overridden by expose rules
            if (graphResult !== undefined) {
                if (
                    typeof context.graph == 'object'
                    && '$ctxMod' in context.graph
                ) {
                    Object.assign(context, context.graph.$ctxMod);
                }
                
                return typeof graphResult == 'object'
                    ? graphResult.expose
                    : graphResult
                    ;
            }
        }
        
        // test property node by expose rules
        if (context.propDef?.exposeRules) {
            const exposeRulesResult = this._testExpositionByExposeRules(
                context.propDef.exposeRules,
                context.groups,
            );
            if (exposeRulesResult) {
                if (typeof exposeRulesResult === 'object') {
                    if (exposeRulesResult.forceExpose) {
                        context.forceExpose = true;
                    }
                    return exposeRulesResult.expose;
                }
                else {
                    return exposeRulesResult;
                }
            }
        }
        
        // on first level - all is exposed by default
        if (context.depth == 0) {
            return true;
        }
        
        // no rule match, graph was not final
        // use default strategy
        return defaultExposure;
    }
    
    protected _testExpositionByExposeRules (
        exposeRules : ExposeRule[],
        groups : string[],
    ) : ExpositionResult
    {
        for (const exposeRule of exposeRules) {
            const matched = this._testExposeRule(
                exposeRule,
                groups,
            );
            if (matched) {
                return {
                    expose: exposeRule.expose,
                    forceExpose: exposeRule.forceExpose,
                };
            }
        }
        
        return undefined;
    }
    
    protected _testExposeRule (
        exposeRule : ExposeRule,
        passedGroups : string[],
    ) : boolean
    {
        let result : boolean = true;
        
        if (
            exposeRule.all
            || exposeRule.any
        ) {
            result = false;
            
            if (
                exposeRule.all
                && exposeRule.all.every(group => passedGroups.includes(group))
            ) {
                result = true;
            }
            
            if (
                exposeRule.any
                && exposeRule.any.some(group => passedGroups.includes(group))
            ) {
                result = true;
            }
        }
        
        if (
            exposeRule.notAny
            || exposeRule.notAll
        ) {
            result = true;
            
            if (
                exposeRule.notAny
                && exposeRule.notAny.some(group => passedGroups.includes(group))
            ) {
                result = false;
            }
            
            if (
                exposeRule.notAll
                && exposeRule.notAll.every(group => passedGroups.includes(group))
            ) {
                result = false;
            }
        }
        
        return result;
    }
    
    
}
