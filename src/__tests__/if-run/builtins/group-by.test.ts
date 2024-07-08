import {ERRORS} from '@grnsft/if-core/utils';

import {GroupBy} from '../../../if-run/builtins/group-by';

import {STRINGS} from '../../../if-run/config';

const {InvalidGroupingError, InputValidationError, GlobalConfigError} = ERRORS;
const {MISSING_GLOBAL_CONFIG, INVALID_GROUP_BY} = STRINGS;

describe('builtins/group-by: ', () => {
  describe('GroupBy: ', () => {
    const plugin = GroupBy();

    describe('init GroupBy: ', () => {
      it('initalizes object with properties.', async () => {
        expect(plugin).toHaveProperty('metadata');
        expect(plugin).toHaveProperty('execute');
      });
    });

    describe('execute(): ', () => {
      it('groups inputs correctly.', () => {
        const inputs = [
          {
            timestamp: '2023-07-06T00:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T05:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T10:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
        ];
        const config = {
          group: ['region', 'cloud/instance-type'],
        };

        const expectedOutput = {
          'uk-west': {
            children: {
              A1: {
                inputs: [
                  {
                    'cloud/instance-type': 'A1',
                    region: 'uk-west',
                    timestamp: '2023-07-06T00:00',
                  },
                  {
                    'cloud/instance-type': 'A1',
                    region: 'uk-west',
                    timestamp: '2023-07-06T05:00',
                  },
                  {
                    'cloud/instance-type': 'A1',
                    region: 'uk-west',
                    timestamp: '2023-07-06T10:00',
                  },
                ],
              },
            },
          },
        };

        const result = plugin.execute(inputs, config);
        expect(result).toEqual(expectedOutput);
      });

      it('throws an error when config is not provided.', () => {
        const inputs = [
          {
            timestamp: '2023-07-06T00:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T05:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T10:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
        ];

        const config = undefined;

        expect.assertions(2);
        try {
          plugin.execute(inputs, config!);
        } catch (error) {
          expect(error).toBeInstanceOf(GlobalConfigError);
          expect(error).toEqual(new GlobalConfigError(MISSING_GLOBAL_CONFIG));
        }
      });

      it('throws an error if `group` is an empty array.', () => {
        const inputs = [
          {
            timestamp: '2023-07-06T00:00',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T05:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
          {
            timestamp: '2023-07-06T10:00',
            region: 'uk-west',
            'cloud/instance-type': 'A1',
          },
        ];
        const config = {
          group: ['region', 'cloud/instance-type'],
        };

        expect.assertions(2);
        try {
          plugin.execute(inputs, config);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidGroupingError);
          expect(error).toEqual(
            new InvalidGroupingError('Invalid group region.')
          );
        }
      });

      it('throws an error if group type is missing from the input.', () => {
        const inputs = [
          {timestamp: 1, region: 'uk-west', 'cloud/instance-type': 'A1'},
        ];
        const config = {
          group: [],
        };

        expect.assertions(2);
        try {
          plugin.execute(inputs, config);
        } catch (error) {
          expect(error).toBeInstanceOf(InputValidationError);
          expect(error).toEqual(
            new InputValidationError(
              '"group" parameter is array must contain at least 1 element(s). Error code: too_small.'
            )
          );
        }
      });

      it('throws an error if input does not have required group type.', () => {
        const inputs = [
          {timestamp: 1, region: 'uk-west', 'cloud/instance-type': 'A1'},
        ];
        const config = {
          group: ['region', 'cloud/instance-type', 'unknown'],
        };

        expect.assertions(2);
        try {
          plugin.execute(inputs, config);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidGroupingError);
          expect(error).toEqual(
            new InvalidGroupingError(INVALID_GROUP_BY(config.group[2]))
          );
        }
      });
    });
  });
});
