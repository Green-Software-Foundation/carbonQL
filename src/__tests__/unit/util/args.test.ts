jest.mock('ts-command-line-args', () => ({
  __esModule: true,
  parse: () => {
    switch (process.env.result) {
      case 'error':
        return {};
      case 'impl':
        return {
          impl: 'impl-mock.yml',
        };
      case 'impl-ompl':
        return {
          impl: 'impl-mock.yml',
          ompl: 'ompl-mock.yml',
        };
      case 'help':
        return {
          help: true,
        };
      default:
        return {
          impl: 'mock-impl.yaml',
          ompl: 'mock-ompl',
        };
    }
  },
}));

import path = require('path');

import {parseProcessArgument} from '../../../util/args';

import {STRINGS, CONFIG} from '../../../config';

const {impact} = CONFIG;
const {HELP} = impact;
const {WRONG_CLI_ARGUMENT} = STRINGS;

describe('util/args: ', () => {
  const originalEnv = process.env;

  describe('parseProcessArgument(): ', () => {
    it('throws error if there is no argument passed.', () => {
      expect.assertions(2);

      process.env.result = 'error'; // used for mocking

      try {
        parseProcessArgument();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toEqual(WRONG_CLI_ARGUMENT);
        }
      }
    });

    it('returns impl path.', () => {
      expect.assertions(1);

      process.env.result = 'impl';

      const result = parseProcessArgument();
      const processRunningPath = process.cwd();

      const implPath = 'impl-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${implPath}`),
      };

      expect(result).toEqual(expectedResult);
    });

    it('returns impl and ompl path.', () => {
      expect.assertions(1);

      process.env.result = 'impl-ompl';

      const result = parseProcessArgument();
      const processRunningPath = process.cwd();

      const implPath = 'impl-mock.yml';
      const omplPath = 'ompl-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${implPath}`),
        outputPath: path.normalize(`${processRunningPath}/${omplPath}`),
      };

      expect(result).toEqual(expectedResult);
    });

    it('logs help.', () => {
      expect.assertions(3);

      const originalLog = console.log;
      console.log = jest.fn();

      process.env.result = 'help';

      const result = parseProcessArgument();

      expect(result).toBeUndefined();
      expect(console.log).toBeCalledTimes(1);
      expect(console.log).toBeCalledWith(HELP);

      console.log = originalLog;
    });
  });

  process.env = originalEnv;
});
