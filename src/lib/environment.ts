import {DateTime} from 'luxon';

import {execPromise} from '../util/helpers';

import {Context, ContextWithExec} from '../types/manifest';
import {NpmListResponse, PackageDependency} from '../types/environment';
import {osInfo} from '../util/os-checker';

/**
 * 1. Gets the high-resolution real time when the application starts.
 * 2. Converts the high-resolution time to milliseconds.
 * 3. Gets the current DateTime.
 * 4. Subtracts the milliseconds from the current DateTime.
 */
const getProcessStartingTimestamp = () => {
  const startTime = process.hrtime();

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const milliseconds = seconds * 1000 + nanoseconds / 1e6;

  const currentDateTime = DateTime.local();

  const applicationStartDateTime = currentDateTime.minus({
    milliseconds: milliseconds,
  });

  return applicationStartDateTime.toUTC().toString();
};

/**
 * Goes through the dependencies, converts them into oneliner.
 */
const flattenDependencies = (dependencies: [string, PackageDependency][]) =>
  dependencies.map(dependency => {
    const [packageName, versionInfo] = dependency;
    const {version, extraneous, resolved} = versionInfo;
    const formattedString = `${packageName}@${version}${
      extraneous ? ` extraneous -> ${resolved}` : ''
    }`;

    return formattedString;
  });

/**
 * 1. Runs `npm list --json`.
 * 2. Parses json data and converts to list.
 */
const listDependencies = async () => {
  const {stdout} = await execPromise('npm list --json');
  const npmListResponse: NpmListResponse = JSON.parse(stdout);
  const dependencies = Object.entries(npmListResponse.dependencies);

  return flattenDependencies(dependencies);
};

/**
 * Injects execution information (command, environment) to existing context.
 */
export const injectEnvironment = async (context: Context) => {
  const dependencies = await listDependencies();
  const info = await osInfo();

  const contextWithExec: ContextWithExec = {
    ...context,
    execution: {
      command: process.argv.join(' '),
      environment: {
        os: info.os,
        'os-version': info['os-version'],
        'node-version': process.versions.node,
        'date-time': getProcessStartingTimestamp(),
        dependencies,
      },
    },
  };

  return contextWithExec;
};
