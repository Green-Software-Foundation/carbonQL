import {AggregatorOperations, aggregator} from '../util/aggregation-storage';

import {AggregationParams} from '../types/manifest';

/**
 *
 */
const verticallyAggregate = (
  node: any,
  storage: AggregatorOperations,
  parentNode = node
) => {
  if (node.children) {
    for (const child in node.children) {
      verticallyAggregate(node.children[child], storage, node);
    }
  }

  if (node.inputs) {
    storage.set(node.outputs);
  }

  parentNode.aggregated = storage.get();
};

/**
 * If aggregation is disabled, then returns given `tree`.
 * Otherwise creates copy of the tree, then applies aggregation to it.
 */
export const aggregate = (tree: any, aggregationParams?: AggregationParams) => {
  if (!aggregationParams || !aggregationParams.type) {
    return tree;
  }

  const {metrics, type} = aggregationParams;

  const copyOfTree = structuredClone(tree);
  const storage = aggregator(metrics);

  if (type === 'vertical') {
    verticallyAggregate(copyOfTree, storage);

    return copyOfTree;
  }

  if (type === 'horizontal') {
    // horizontallyAggregte();
    // return copyOfTree
  }

  return copyOfTree;
};
