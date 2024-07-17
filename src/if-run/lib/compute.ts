import {PluginParams} from '@grnsft/if-core/types';

import {Regroup} from './regroup';

import {mergeObjects} from '../util/helpers';
import {debugLogger} from '../../common/util/debug-logger';

import {STRINGS} from '../config/strings';

import {isExecute} from '../types/interface';
import {ComputeParams, Node, PhasedPipeline} from '../types/compute';

const {MERGING_DEFAULTS_WITH_INPUT_DATA} = STRINGS;

/**
 * Traverses all child nodes based on children grouping.
 */
const traverse = async (children: any, params: ComputeParams) => {
  for (const child in children) {
    await computeNode(children[child], params);
  }
};

/**
 * Appends `default` values to `inputs`.
 */
const mergeDefaults = (
  inputs: PluginParams[],
  defaults: PluginParams | undefined
) => {
  if (inputs) {
    const response = defaults
      ? inputs.map(input => mergeObjects(defaults, input))
      : inputs;

    return response;
  }

  console.debug(MERGING_DEFAULTS_WITH_INPUT_DATA);

  return defaults ? [defaults] : [];
};

/**
 * 1. If the node has it's own pipeline, defaults or config then use that,
 *    otherwise use whatever has been passed down from further up the tree.
 * 2. If it's a grouping node, then first of all computes all it's children.
 *    This is doing a depth first traversal.
 * 3. Otherwise merges the defaults into the inputs.
 * 4. Goes through the pipeline plugins, by checking if it's `execute` plugin. If so sets outputs.
 *    If is a `groupby` plugin, it will return child components rather than outputs.
 * 5. Since after `groupby`, there are new child components, then computes them.
 *    Note: `pipeline` now equals the remaining plugins to apply to each child
 */
const computeNode = async (node: Node, params: ComputeParams): Promise<any> => {
  const pipeline = node.pipeline || (params.pipeline as PhasedPipeline);
  const config = node.config || params.config;
  const defaults = node.defaults || params.defaults;
  const noFlags = !params.observe && !params.regroup && !params.compute;

  if (node.children) {
    return traverse(node.children, {
      ...params,
      pipeline,
      defaults,
      config,
    });
  }

  let inputStorage = structuredClone(node.inputs) as PluginParams[];
  inputStorage = mergeDefaults(inputStorage, defaults);
  const pipelineCopy = structuredClone(pipeline);

  /**
   * If iteration is on observe pipeline, then executes observe plugins and sets the inputs value.
   */
  if ((noFlags || params.observe) && pipelineCopy.observe) {
    while (pipelineCopy.observe.length !== 0) {
      const pluginName = pipelineCopy.observe.shift() as string;
      const plugin = params.pluginStorage.get(pluginName);
      const nodeConfig = config && config[pluginName];

      if (isExecute(plugin)) {
        inputStorage = await plugin.execute(inputStorage, nodeConfig);
        node.inputs = inputStorage;
      }
    }
  }

  /**
   * If regroup is requested, execute regroup strategy, delete child's inputs, outputs and empty regroup array.
   */
  if ((noFlags || params.regroup) && pipeline.regroup) {
    node.children = Regroup(inputStorage, pipeline.regroup);
    delete node.inputs;
    delete node.outputs;

    return traverse(node.children, {
      ...params,
      pipeline: {
        ...pipelineCopy,
        regroup: undefined,
      },
      defaults,
      config,
    });
  }

  /**
   * If iteration is on compute plugin, then executes compute plugins and sets the outputs value.
   */
  if ((noFlags || params.compute) && pipelineCopy.compute) {
    while (pipelineCopy.compute.length !== 0) {
      const pluginName = pipelineCopy.compute.shift() as string;
      const plugin = params.pluginStorage.get(pluginName);
      const nodeConfig = config && config[pluginName];

      if (isExecute(plugin)) {
        inputStorage = await plugin.execute(inputStorage, nodeConfig);
        node.outputs = inputStorage;
        debugLogger.setExecutingPluginName();
      }
    }
  }
};

/**
 * Creates copy of existing tree, then applies computing strategy.
 */
export const compute = async (tree: any, params: ComputeParams) => {
  const copyOfTree = structuredClone(tree);

  await computeNode(copyOfTree, params);

  return copyOfTree;
};
