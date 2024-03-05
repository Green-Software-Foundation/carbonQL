#!/usr/bin/env node
import {aggregate} from './lib/aggregate';
import {compute} from './lib/compute';
import {exhaust} from './lib/exhaust';
import {initalize} from './lib/initialize';
import {load} from './lib/load';
import {parameterize} from './lib/parameterize';

import {parseArgs} from './util/args';
import {ERRORS} from './util/errors';
import {andHandle} from './util/helpers';
import {logger} from './util/logger';

import {STRINGS} from './config';

import packageJson from '../package.json';

const {CliInputError} = ERRORS;

const {DISCLAIMER_MESSAGE, SOMETHING_WRONG} = STRINGS;

const impactEngine = async () => {
  logger.info(DISCLAIMER_MESSAGE);
  const options = parseArgs();

  if (options) {
    const {inputPath, outputPath, paramPath} = options;

    const {tree, context, parameters} = await load(inputPath, paramPath);
    parameterize.combine(context.params, parameters);
    const plugins = await initalize(context.initialize.plugins);
    const computedTree = await compute(tree, {context, plugins});
    const aggregatedTree = aggregate(computedTree, context.aggregation);
    context['if-version'] = packageJson.version;
    exhaust(aggregatedTree, context, outputPath);

    return;
  }

  return Promise.reject(new CliInputError(SOMETHING_WRONG));
};

impactEngine().catch(andHandle);
