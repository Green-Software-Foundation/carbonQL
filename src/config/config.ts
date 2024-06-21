import {ArgumentConfig, ParseOptions} from 'ts-command-line-args';

import {STRINGS} from './strings';

import {
  IFDiffArgs,
  IEArgs,
  IFEnvArgs,
  IFCheckArgs,
} from '../types/process-args';

const {DISCLAIMER_MESSAGE} = STRINGS;

export const CONFIG = {
  IE: {
    ARGS: {
      manifest: {
        type: String,
        optional: true,
        alias: 'm',
        description: '[path to the input file]',
      },
      output: {
        type: String,
        optional: true,
        alias: 'o',
        description: '[path to the output file]',
      },
      'override-params': {
        type: String,
        optional: true,
        alias: 'p',
        description: '[path to a parameter file that overrides our defaults]',
      },
      stdout: {
        type: Boolean,
        optional: true,
        alias: 's',
        description: '[prints out to the console]',
      },
      help: {
        type: Boolean,
        optional: true,
        alias: 'h',
        description: '[prints out the above help instruction]',
      },
      debug: {
        type: Boolean,
        optional: true,
        alias: 'd',
        description: '[prints out debug logs to the console]',
      },
    } as ArgumentConfig<IEArgs>,
    HELP: {
      helpArg: 'help',
      headerContentSections: [
        {header: 'Impact Framework', content: 'Helpful keywords:'},
      ],
      footerContentSections: [
        {header: 'Green Software Foundation', content: DISCLAIMER_MESSAGE},
      ],
    } as ParseOptions<any>,
  },
  IF_DIFF: {
    ARGS: {
      source: {
        type: String,
        optional: true,
        alias: 's',
        description: '[path to the source file]',
      },
      target: {
        type: String,
        optional: false,
        alias: 't',
        description: '[path to the target file',
      },
    } as ArgumentConfig<IFDiffArgs>,
    HELP: {
      helpArg: 'help',
      headerContentSections: [
        {header: 'Impact Framework', content: 'IF-Diff Helpful keywords:'},
      ],
      footerContentSections: [
        {header: 'Green Software Foundation', content: DISCLAIMER_MESSAGE},
      ],
    } as ParseOptions<any>,
    SUCCESS_MESSAGE: 'Files match!',
    FAILURE_MESSAGE: 'Files do not match!',
  },
  IF_ENV: {
    ARGS: {
      manifest: {
        type: String,
        optional: true,
        alias: 'm',
        description: '[path to the manifest file]',
      },
      install: {
        type: Boolean,
        optional: true,
        alias: 'i',
        description: '[command to install package.json]',
      },
      cwd: {
        type: Boolean,
        optional: true,
        alias: 'c',
        description:
          '[command to generate the package.json in the command working directory]',
      },
    } as ArgumentConfig<IFEnvArgs>,
    HELP: {
      helpArg: 'help',
      headerContentSections: [
        {header: 'Impact Framework', content: 'IF-Env Helpful keywords:'},
      ],
      footerContentSections: [
        {header: 'Green Software Foundation', content: DISCLAIMER_MESSAGE},
      ],
    } as ParseOptions<any>,
    SUCCESS_MESSAGE: 'The environment is successfully setup!',
    FAILURE_MESSAGE: 'Faied to create the environment!',
    FAILURE_MESSAGE_TEMPLATE:
      'Faied to create the environment with the template manifest!',
    FAILURE_MESSAGE_DEPENDENCIES: 'Manifest dependencies are not available!',
  },
  IF_CHECK: {
    ARGS: {
      manifest: {
        type: String,
        optional: true,
        alias: 'm',
        description: '[path to the manifest file]',
      },
      directory: {
        type: String,
        optional: true,
        alias: 'd',
        description: '[path to the manifests directory]',
      },
    } as ArgumentConfig<IFCheckArgs>,
    HELP: {
      helpArg: 'help',
      headerContentSections: [
        {header: 'Impact Framework', content: 'IF-Check Helpful keywords:'},
      ],
      footerContentSections: [
        {header: 'Green Software Foundation', content: DISCLAIMER_MESSAGE},
      ],
    } as ParseOptions<any>,
  },
  GITHUB_PATH: 'https://github.com',
  NATIVE_PLUGIN: 'if-plugins',
  AGGREGATION_ADDITIONAL_PARAMS: ['timestamp', 'duration'],
};
