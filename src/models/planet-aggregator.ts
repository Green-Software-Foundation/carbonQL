import {ERRORS} from '../util/errors';

import {
  AggregationResult,
  PlanetAggregatorParams,
} from '../types/planet-aggregator';
import {ModelParams} from '../types/model-interface';
import {UnitKeyName} from '../types/units';
import {UnitsDealer} from '../util/units-dealer';

const {InvalidAggregationParams} = ERRORS;

/**
 * Aggregates child node level metrics. Uses provided aggregation `params`.
 */
export const planetAggregator = async (
  inputs: ModelParams[],
  params: PlanetAggregatorParams
) => {
  if (
    !params['aggregation-metrics'] ||
    params['aggregation-metrics'].length === 0
  ) {
    throw new InvalidAggregationParams(
      'Provided aggregation metrics are invalid. Please provide an array of strings.'
    );
  }

  const aggregationMetrics = params['aggregation-metrics'] as UnitKeyName[];
  const dealer = await UnitsDealer();

  return inputs.reduce((acc, input, index) => {
    for (const metric of aggregationMetrics) {
      if (!(metric in input)) {
        throw new InvalidAggregationParams(
          `Aggregation metric ${metric} is not found in inputs[${index}].`
        );
      }

      const accessKey = `aggregated-${metric}`;
      const value = parseFloat(input[metric]);
      acc[accessKey] = acc[accessKey] ?? 0;
      acc[accessKey] += value;
      const aggregationMethod = dealer.askToGiveMethodFor(metric);

      if (index === inputs.length - 1) {
        if (aggregationMethod === 'avg') {
          acc[accessKey] /= inputs.length;
        }
      }
    }

    return acc;
  }, {} as AggregationResult);
};

// remove aggregation-method functionality from global layer, use units dealer instead
// leave aggregation-metrics. If metric doesn't exist in units dealer database, throw error
// vertical aggregation ? how to get easy way to do (cost effective)