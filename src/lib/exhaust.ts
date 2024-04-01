/**
 * @todo This is temporary solution, will be refactored to support dynamic plugins.
 */
import {ExportCSV} from '../builtins/export-csv';
import {ExportCSVRaw} from '../builtins/export-csv-raw';
import {ExportLog} from '../builtins/export-log';
import {ExportYaml} from '../builtins/export-yaml';

import {ERRORS} from '../util/errors';

import {STRINGS} from '../config';

import {Context} from '../types/manifest';
import {ExhaustPluginInterface} from '../types/interface';

const {ModuleInitializationError} = ERRORS;
const {INVALID_EXHAUST_PLUGIN} = STRINGS;

/**
 * Initialize exhaust plugins based on the provided config
 */
const initializeExhaustPlugins = (plugins: string[]) =>
  plugins.map(initializeExhaustPlugin);

/**
 * factory method for exhaust plugins
 */
const initializeExhaustPlugin = (name: string): ExhaustPluginInterface => {
  switch (name) {
    case 'yaml':
      return ExportYaml();
    case 'csv':
      return ExportCSV();
    case 'csv-raw':
      return ExportCSVRaw();
    case 'log':
      return ExportLog();
    default:
      throw new ModuleInitializationError(INVALID_EXHAUST_PLUGIN(name));
  }
};

/**
 * Output manager - Exhaust.
 * Grabs output plugins from context, executes every.
 */
export const exhaust = (tree: any, context: Context, outputPath?: string) => {
  const outputPlugins = context.initialize.outputs;

  if (!outputPlugins) {
    ExportLog().executeExhaust(tree, context);

    return;
  }

  const exhaustPlugins = initializeExhaustPlugins(outputPlugins);
  exhaustPlugins.forEach(plugin =>
    plugin.executeExhaust(tree, context, outputPath)
  );
};
