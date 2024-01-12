import {planetAggregator} from '../../../lib/planet-aggregator';

import {STRINGS} from '../../../config';

import {ERRORS} from '../../../util/errors';

import {UnitKeyName} from '../../../types/units';

const {INVALID_AGGREGATION_METHOD, METRIC_MISSING} = STRINGS;

const {InvalidAggregationParams} = ERRORS;

describe('lib/planet-aggregator: ', () => {
  describe('planetAggregator(): ', () => {
    it('throws error if aggregation method is none.', async () => {
      const inputs = [{}];
      const metrics = ['total-resources'] as UnitKeyName[];

      const expectedMessage = INVALID_AGGREGATION_METHOD('none');

      expect.assertions(1);

      try {
        await planetAggregator(inputs, metrics);
      } catch (error) {
        expect(error).toEqual(new InvalidAggregationParams(expectedMessage));
      }
    });

    it('throws error if metric is not found while aggregation.', async () => {
      const inputs = [
        {
          'ram-util': 10,
        },
      ];
      const metrics = ['cpu-util'] as UnitKeyName[];

      const expectedMessage = METRIC_MISSING(metrics[0], 0);

      expect.assertions(1);

      try {
        await planetAggregator(inputs, metrics);
      } catch (error) {
        expect(error).toEqual(new InvalidAggregationParams(expectedMessage));
      }
    });

    it('should successfully calculate avg.', async () => {
      const inputs = [
        {
          'cpu-util': 10,
        },
        {
          'cpu-util': 20,
        },
      ];
      const metrics = ['cpu-util'] as UnitKeyName[];

      const expectedKey = `aggregated-${Object.keys(inputs[0])[0]}`;
      const expectedValue = (inputs[0]['cpu-util'] + inputs[1]['cpu-util']) / 2;
      const expectedResult = {
        [`${expectedKey}`]: expectedValue,
      };

      const aggregatedResult = await planetAggregator(inputs, metrics);

      expect(aggregatedResult).toEqual(expectedResult);
    });

    it('should successfully calculate sum.', async () => {
      const inputs = [
        {
          'disk-io': 10,
        },
        {
          'disk-io': 20,
        },
      ];
      const metrics = ['disk-io'] as UnitKeyName[];

      const expectedKey = `aggregated-${Object.keys(inputs[0])[0]}`;
      const expectedValue = inputs[0]['disk-io'] + inputs[1]['disk-io'];
      const expectedResult = {
        [`${expectedKey}`]: expectedValue,
      };

      const aggregatedResult = await planetAggregator(inputs, metrics);

      expect(aggregatedResult).toEqual(expectedResult);
    });
  });
});
