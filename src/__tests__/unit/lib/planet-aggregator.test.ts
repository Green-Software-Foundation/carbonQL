/* eslint-disable @typescript-eslint/ban-ts-comment */
import {planetAggregator} from '../../../lib/planet-aggregator';

import {ERRORS} from '../../../util/errors';

const {InvalidAggregationParams} = ERRORS;

describe('lib/planet-aggregator: ', () => {
  describe('planetAggregator(): ', () => {
    const inputs = [
      {
        timestamp: '2023-07-06T00:00',
        duration: 10,
        'cpu-util': 50,
        'e-net': 0.000811,
        requests: 380,
        carbon: 10,
        energy: 20,
      },
      {
        timestamp: '2023-07-06T00:00',
        duration: 10,
        'cpu-util': 50,
        'e-net': 0.000811,
        requests: 380,
        carbon: 10,
        energy: 20,
      },
      {
        timestamp: '2023-07-06T00:00',
        duration: 10,
        'cpu-util': 50,
        'e-net': 0.000811,
        requests: 380,
        carbon: 10,
        energy: 20,
      },
    ];
    const expectedErrorMessage =
      'Provided aggregation metrics are invalid. Please provide an array of strings.';

    it('throws error if aggregation object is empty.', () => {
      const params = {};

      expect.assertions(1);

      try {
        // @ts-ignore
        planetAggregator(inputs, params);
      } catch (error) {
        if (error instanceof InvalidAggregationParams) {
          expect(error.message).toEqual(expectedErrorMessage);
        }
      }
    });

    it('should throw error if aggregation metrics length is 0.', () => {
      const params = {
        'aggregation-metrics': [],
        'aggregation-method': 'sum',
      };

      expect.assertions(1);

      try {
        planetAggregator(inputs, params);
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toEqual(expectedErrorMessage);
        }
      }
    });

    it('should calculate sum if method is not provided.', () => {
      const params = {
        'aggregation-metrics': ['carbon', 'energy'],
        'aggregation-method': '',
      };

      expect.assertions(1);

      const result = planetAggregator(inputs, params);
      const expectedCarbon =
        inputs[0].carbon + inputs[1].carbon + inputs[2].carbon;
      const expectedEnergy =
        inputs[0].energy + inputs[1].energy + inputs[2].energy;

      expect(result[`aggregated-${params['aggregation-metrics'][0]}`]).toBe(
        expectedCarbon
      );
      expect(result[`aggregated-${params['aggregation-metrics'][1]}`]).toBe(
        expectedEnergy
      );
    });
  });
});
