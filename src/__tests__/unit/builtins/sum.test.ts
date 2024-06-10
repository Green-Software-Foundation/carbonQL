import {Sum} from '../../../builtins/sum';

import {ERRORS} from '../../../util/errors';
import {STRINGS} from '../../../config';

const {GlobalConfigError, MissingInputDataError} = ERRORS;
const {MISSING_GLOBAL_CONFIG, MISSING_INPUT_DATA} = STRINGS;

describe('builtins/sum: ', () => {
  describe('Sum: ', () => {
    const globalConfig = {
      'input-parameters': ['cpu/energy', 'network/energy', 'memory/energy'],
      'output-parameter': 'energy',
    };
    const sum = Sum(globalConfig);

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

      it('throws an error when global config is not provided.', () => {
        const config = undefined;
        const sum = Sum(config!);

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
          expect(error).toStrictEqual(
            new GlobalConfigError(MISSING_GLOBAL_CONFIG)
          );
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
            new MissingInputDataError(MISSING_INPUT_DATA('cpu/energy'))
          );
        }
      });

      it('returns a result with input params not related to energy.', () => {
        expect.assertions(1);
        const newConfig = {
          'input-parameters': ['carbon', 'other-carbon'],
          'output-parameter': 'carbon-sum',
        };
        const sum = Sum(newConfig);

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
