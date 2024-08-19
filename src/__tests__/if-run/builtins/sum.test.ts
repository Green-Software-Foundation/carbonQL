import {ERRORS} from '@grnsft/if-core/utils';

import {Sum} from '../../../if-run/builtins/sum';

import {STRINGS} from '../../../if-run/config';

const {ConfigError, InputValidationError} = ERRORS;
const {MISSING_CONFIG} = STRINGS;

describe('builtins/sum: ', () => {
  describe('Sum: ', () => {
    const config = {
      'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
      'output-parameter': 'energy',
    };
    const parametersMetadata = {
      inputs: {},
      outputs: {},
    };
    const sum = Sum(config, parametersMetadata, {});

    describe('init: ', () => {
      it('successfully initalized.', () => {
        expect(sum).toHaveProperty('metadata');
        expect(sum).toHaveProperty('execute');
      });
    });

    describe('execute(): ', () => {
      it('successfully applies Sum strategy to given input.', () => {
        expect.assertions(1);

        const expectedResult = [
          {
            duration: 3600,
            'cpu/energy': 1,
            'network/energy': 1,
            'memory/energy': 1,
            energy: 3,
            timestamp: '2021-01-01T00:00:00Z',
          },
        ];

        const result = sum.execute([
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'cpu/energy': 1,
            'network/energy': 1,
            'memory/energy': 1,
          },
        ]);

        expect(result).toStrictEqual(expectedResult);
      });

      it('successfully executes when `mapping` has valid data.', () => {
        expect.assertions(1);

        const mapping = {
          'cpu/energy': 'energy-from-cpu',
          'network/energy': 'energy-from-network',
        };
        const config = {
          'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
          'output-parameter': 'energy',
        };

        const sum = Sum(config, parametersMetadata, mapping);

        const expectedResult = [
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'energy-from-cpu': 1,
            'energy-from-network': 1,
            'memory/energy': 1,
            energy: 3,
          },
        ];

        const result = sum.execute([
          {
            timestamp: '2021-01-01T00:00:00Z',
            duration: 3600,
            'energy-from-cpu': 1,
            'energy-from-network': 1,
            'memory/energy': 1,
          },
        ]);

        expect(result).toStrictEqual(expectedResult);
      });

      it('throws an error when config is not provided.', () => {
        const config = undefined;
        const sum = Sum(config!, parametersMetadata, {});

        expect.assertions(1);

        try {
          sum.execute([
            {
              timestamp: '2021-01-01T00:00:00Z',
              duration: 3600,
              'cpu/energy': 1,
              'network/energy': 1,
              'memory/energy': 1,
            },
          ]);
        } catch (error) {
          expect(error).toStrictEqual(new ConfigError(MISSING_CONFIG));
        }
      });

      it('throws an error on missing params in input.', () => {
        expect.assertions(1);

        try {
          sum.execute([
            {
              duration: 3600,
              timestamp: '2021-01-01T00:00:00Z',
            },
          ]);
        } catch (error) {
          expect(error).toStrictEqual(
            new InputValidationError(
              '"cpu/energy" parameter is required. Error code: invalid_type.,"network/energy" parameter is required. Error code: invalid_type.,"memory/energy" parameter is required. Error code: invalid_type.'
            )
          );
        }
      });

      it('returns a result with input params not related to energy.', () => {
        expect.assertions(1);
        const newConfig = {
          'input-parameters': ['carbon', 'other-carbon'],
          'output-parameter': 'carbon-sum',
        };
        const sum = Sum(newConfig, parametersMetadata, {});

        const data = [
          {
            duration: 3600,
            timestamp: '2021-01-01T00:00:00Z',
            carbon: 1,
            'other-carbon': 2,
          },
        ];
        const response = sum.execute(data);

        const expectedResult = [
          {
            duration: 3600,
            carbon: 1,
            'other-carbon': 2,
            'carbon-sum': 3,
            timestamp: '2021-01-01T00:00:00Z',
          },
        ];

        expect(response).toEqual(expectedResult);
      });
    });
  });
});
