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
      case 'not-yaml':
        return {
          impl: 'mock.notyaml',
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

import {parseArgs} from '../../../util/args';
import {ERRORS} from '../../../util/errors';

import {STRINGS} from '../../../config';

const {CliInputError} = ERRORS;

const {IMPL_IS_MISSING, FILE_IS_NOT_YAML} = STRINGS;

describe('util/args: ', () => {
  const originalEnv = process.env;

  describe('parseArgs(): ', () => {
    it('throws error if there is no argument passed.', () => {
      expect.assertions(2);

      process.env.result = 'error'; // used for mocking

      try {
        parseArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(CliInputError);
          expect(error.message).toEqual(IMPL_IS_MISSING);
        }
      }
    });

    it('returns impl path.', () => {
      expect.assertions(1);

      process.env.result = 'impl';

      const result = parseArgs();
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

      const result = parseArgs();
      const processRunningPath = process.cwd();

      const implPath = 'impl-mock.yml';
      const omplPath = 'ompl-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${implPath}`),
        outputPath: path.normalize(`${processRunningPath}/${omplPath}`),
      };

      expect(result).toEqual(expectedResult);
    });

    it('throws error if file is not yaml.', () => {
      expect.assertions(2);

      process.env.result = 'not-yaml';

      try {
        parseArgs();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(CliInputError);
          expect(error.message).toEqual(FILE_IS_NOT_YAML);
        }
      }
    });
  });

  process.env = originalEnv;
});
