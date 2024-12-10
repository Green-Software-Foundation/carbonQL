jest.mock('ts-command-line-args', () => ({
  __esModule: true,
  parse: () => {
    switch (process.env.result) {
      case 'throw-error-object':
        throw new Error(MANIFEST_IS_MISSING);
      case 'error':
        throw MANIFEST_IS_MISSING;
      case 'manifest-is-missing':
        return {};
      case 'manifest':
        return {
          manifest: 'manifest-mock.yml',
        };
      case 'absolute-path':
        return {
          manifest: path.normalize(`${processRunningPath}/manifest-mock.yml`),
        };
      case 'manifest-output':
        return {
          manifest: 'manifest-mock.yml',
          output: 'output-mock.yml',
        };
      case 'not-yaml':
        return {
          manifest: 'mock.notyaml',
        };
      case 'no-output':
        return {
          manifest: 'manifest-mock.yaml',
          'no-output': false,
        };
      case 'no-output-true':
        return {
          manifest: 'manifest-mock.yaml',
          'no-output': true,
        };
      case 'append':
        return {
          manifest: 'manifest-mock.yaml',
          append: true,
        };
      default:
        return {
          manifest: 'mock-manifest.yaml',
          output: 'mock-output',
        };
    }
  },
}));

const mockWarn = jest.fn(message => {
  if (process.env.LOGGER === 'true') {
    expect(message).toEqual(NO_OUTPUT);
  }
});

jest.mock('../../../common/util/logger', () => ({
  logger: {
    warn: mockWarn,
  },
}));

const processRunningPath = process.cwd();
import * as path from 'node:path';

import {ERRORS} from '@grnsft/if-core/utils';

import {parseIfRunProcessArgs} from '../../../if-run/util/args';

import {STRINGS as COMMON_STRINGS} from '../../../common/config';
import {STRINGS} from '../../../if-run/config/strings';

const {SOURCE_IS_NOT_YAML, MANIFEST_IS_MISSING} = COMMON_STRINGS;
const {NO_OUTPUT} = STRINGS;
const {CliSourceFileError, ParseCliParamsError} = ERRORS;

describe('if-run/util/args: ', () => {
  describe('parseIfRunProcessArgs(): ', () => {
    it('throws error if there is no argument passed.', () => {
      expect.assertions(4);

      process.env.result = 'error'; // used for mocking

      try {
        parseIfRunProcessArgs();
      } catch (error) {
        expect(error).toEqual(MANIFEST_IS_MISSING);
      }

      process.env.result = 'throw-error-object';

      try {
        parseIfRunProcessArgs();
      } catch (error) {
        expect(error).toEqual(new ParseCliParamsError(MANIFEST_IS_MISSING));
      }

      process.env.result = 'manifest-is-missing';

      try {
        parseIfRunProcessArgs();
      } catch (error) {
        expect(error).toBeInstanceOf(CliSourceFileError);
        expect(error).toEqual(new CliSourceFileError(MANIFEST_IS_MISSING));
      }
    });

    it('returns manifest path.', () => {
      expect.assertions(1);

      process.env.result = 'manifest';

      const result = parseIfRunProcessArgs();
      const manifestPath = 'manifest-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        outputOptions: {
          'no-output': undefined,
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('returns manifest with absolute path.', () => {
      expect.assertions(1);

      process.env.result = 'absolute-path';

      const result = parseIfRunProcessArgs();
      const manifestPath = 'manifest-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        outputOptions: {},
      };

      expect(result).toEqual(expectedResult);
    });

    it('returns manifest and output path.', () => {
      expect.assertions(1);

      process.env.result = 'manifest-output';

      const result = parseIfRunProcessArgs();
      const manifestPath = 'manifest-mock.yml';
      const outputPath = 'output-mock.yml';
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        outputOptions: {
          outputPath: path.normalize(`${processRunningPath}/${outputPath}`),
          'no-output': undefined,
        },
      };

      expect(result).toEqual(expectedResult);
    });

    it('throws error if file is not yaml.', () => {
      expect.assertions(2);

      process.env.result = 'not-yaml';

      try {
        parseIfRunProcessArgs();
      } catch (error) {
        expect(error).toBeInstanceOf(CliSourceFileError);
        expect(error).toEqual(new CliSourceFileError(SOURCE_IS_NOT_YAML));
      }
    });

    it('returns `no-output` and manifest.', () => {
      expect.assertions(1);

      process.env.result = 'no-output';
      const manifestPath = 'manifest-mock.yaml';

      const response = parseIfRunProcessArgs();
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        outputOptions: {},
      };

      expect(response).toEqual(expectedResult);
    });

    it('executes when `no-output` and manifest persist.', () => {
      process.env.LOGGER = 'true';
      process.env.result = 'no-output-true';
      const manifestPath = 'manifest-mock.yaml';

      const response = parseIfRunProcessArgs();
      const expectedResult = {
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        compute: undefined,
        debug: undefined,
        observe: undefined,
        outputOptions: {
          noOutput: true,
        },
        regroup: undefined,
      };

      expect.assertions(2);
      expect(response).toEqual(expectedResult);
    });

    it('executes when `append` is provided.', () => {
      process.env.result = 'append';
      const manifestPath = 'manifest-mock.yaml';

      const response = parseIfRunProcessArgs();
      const expectedResult = {
        append: true,
        inputPath: path.normalize(`${processRunningPath}/${manifestPath}`),
        compute: undefined,
        debug: undefined,
        observe: undefined,
        outputOptions: {},
        regroup: undefined,
      };

      expect(response).toEqual(expectedResult);
    });
  });
});
