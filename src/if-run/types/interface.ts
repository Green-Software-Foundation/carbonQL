import {ExecutePlugin, GroupByPlugin} from '@grnsft/if-core/types';

export type PluginInterface = ExecutePlugin | GroupByPlugin;

export const isExecute = (plugin: PluginInterface): plugin is ExecutePlugin =>
  (plugin as ExecutePlugin).metadata.kind === 'execute';
