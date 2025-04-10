import { registerBuiltInTransformers } from './registerBuiltInTransformers.js';
import { Serializer } from './Serializer.js';
import 'reflect-metadata';

export * from './def.js';
export * from './helpers/index.js';

export * from './decorators/index.js';
export * as Srlz from './decorators/index.js';

export * from './ObjectLinkProcessor.js';
export * from './Context.js';
export * from './Registry.js';
export * from './Serializer.js';

export * from './transformers/index.js';

export const serializer = new Serializer();

registerBuiltInTransformers();
