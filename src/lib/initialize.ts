import pathLib = require('path');

import {ERRORS} from '../util/errors';
import {logger} from '../util/logger';

import {CONFIG, STRINGS} from '../config';

import {ExhaustPluginInterface, PluginInterface} from '../types/interface';
import {PluginsStorage} from '../types/initialize';
import {GlobalPlugins, PluginOptions} from '../types/manifest';

const {ModuleInitializationError, PluginCredentialError} = ERRORS;

const {GITHUB_PATH, NATIVE_PLUGIN} = CONFIG;
const {MISSING_METHOD, MISSING_PATH, NOT_NATIVE_PLUGIN, INVALID_MODULE_PATH} =
  STRINGS;

/**
 * Imports module by given `path`.
 */
const importModuleFrom = async (path: string) => {
  try {
    const module = await import(path);

    return module;
  } catch (error) {
    throw new ModuleInitializationError(INVALID_MODULE_PATH(path));
  }
};

/**
 * Imports `module` from given `path`, then checks if it's `ModelPluginInterface` extension.
 */
const importAndVerifyModule = async (method: string, path: string) => {
  const pluginModule = await importModuleFrom(path);

  return pluginModule[method];
};

/**
 * Checks if plugin is missing then rejects with error.
 * Then checks if `path` is starting with github, then grabs the repository name.
 * Imports module, then checks if it's a valid plugin.
 */
const handModule = (method: string, path: string) => {
  if (path === 'builtin') {
    path = pathLib.normalize(`${__dirname}/../models`);
  } else {
    if (path?.startsWith(GITHUB_PATH)) {
      const parts = path.split('/');
      path = parts[parts.length - 1];
    }

    if (!path.includes(NATIVE_PLUGIN)) {
      logger.warn(NOT_NATIVE_PLUGIN);
    }
  }

  return importAndVerifyModule(method, path);
};

/**
 * Initializes a pipeline plugin with global config.
 */
const initPipeLinePlugin = async (
  initPluginParams: PluginOptions
): Promise<PluginInterface> => {
  return initPlugin(initPluginParams);
};

/**
 * Initializes exhaust plugin with global config.
 */
const initExhaustPlugin = async (
  initPluginParams: PluginOptions
): Promise<ExhaustPluginInterface> => {
  return initPlugin(initPluginParams);
};

/**
 * Initializes plugin with global config.
 */
const initPlugin = async (
  initPluginParams: PluginOptions
): Promise<PluginInterface> => {
  const {method, path, 'global-config': globalConfig} = initPluginParams;

  if (!method) {
    throw new PluginCredentialError(MISSING_METHOD);
  }

  if (!path) {
    throw new PluginCredentialError(MISSING_PATH);
  }

  const plugin = await handModule(method, path);

  return plugin(globalConfig);
};

/**
 * Registers all plugins from `manifest`.`initalize` property.
 */
export const initalizePipelinePlugins = async (
  plugins: GlobalPlugins
): Promise<PluginsStorage> => {
  const storage: PluginsStorage = {};

  for await (const pluginName of Object.keys(plugins)) {
    storage[pluginName] = await initPipeLinePlugin(plugins[pluginName]);
  }

  return storage;
};

/**
 * Registers all exhaust plugins
 */
export const initalizeExhaustPlugins = async (
  plugins?: GlobalPlugins
): Promise<ExhaustPluginInterface[]> => {
  const exhaustPlugins: ExhaustPluginInterface[] = [];

  if (plugins) {
    for await (const pluginName of Object.keys(plugins)) {
      exhaustPlugins.push(await initExhaustPlugin(plugins[pluginName]));
    }
  }

  return exhaustPlugins;
};
