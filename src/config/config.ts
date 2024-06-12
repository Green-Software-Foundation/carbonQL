import {ArgumentConfig, ParseOptions} from 'ts-command-line-args';

import {STRINGS} from './strings';

import {IFDiffArgs, IEArgs} from '../types/process-args';

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
  GITHUB_PATH: 'https://github.com',
  NATIVE_PLUGIN: 'if-plugins',
  AGGREGATION_ADDITIONAL_PARAMS: ['timestamp', 'duration'],
};
