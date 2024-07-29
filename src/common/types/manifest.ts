import {z} from 'zod';

import {manifestSchema} from '../util/validations';

export type Manifest = z.infer<typeof manifestSchema>;

export type GlobalPlugins = Manifest['initialize']['plugins'];

export type PluginOptions = GlobalPlugins[string];
export type PluginSettings = Omit<PluginOptions, 'path' | 'method'>;

export type AggregationParams = Manifest['aggregation'];
export type AggregationParamsWithoutType = Omit<
  Exclude<AggregationParams, null | undefined>,
  'type'
>;

export type AggregationParamsSure = Extract<Manifest['aggregation'], {}>;

export type Context = Omit<Manifest, 'tree'>;

export type ContextWithExec = Omit<Manifest, 'tree'>;
