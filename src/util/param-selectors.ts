import {Parameters} from '../types/units';

/**
 * Returns aggregation method for given `unitName`. If doesn't exist then returns value `sum`.
 */
export const getAggregationMethod = (
  unitName: string,
  parameters: Parameters
) => {
  if (`${unitName}` in parameters) {
    return parameters[unitName].aggregation;
  }

  return 'sum';
};
