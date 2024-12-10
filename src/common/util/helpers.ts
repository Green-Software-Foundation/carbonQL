#!/usr/bin/env node
/* eslint-disable no-process-exit */
import {createInterface} from 'node:readline/promises';
import {exec, execFileSync} from 'child_process';
import * as path from 'path';
import {promisify} from 'util';

/**
 * Promise version of Node's `exec` from `child-process`.
 */
export const execPromise = promisify(exec);

/**
 * Prepends process path to given `filePath`.
 */
export const prependFullFilePath = (filePath: string) => {
  const processRunningPath = process.cwd();

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.normalize(`${processRunningPath}/${filePath}`);
};

/**
 * Checks if there is data piped, then collects it.
 * Otherwise returns empty string.
 */
const collectPipedData = async () => {
  if (process.stdin.isTTY) {
    return '';
  }

  const readline = createInterface({
    input: process.stdin,
  });

  const data: string[] = [];

  for await (const line of readline) {
    data.push(line);
  }

  return data.join('\n');
};

/**
 * Checks if there is piped data, tries to parse yaml from it.
 * Returns empty string if haven't found anything.
 */
export const parseManifestFromStdin = async () => {
  const pipedSourceManifest = await collectPipedData();

  if (!pipedSourceManifest) {
    return '';
  }

  const regex = /# start((?:.*\n)+?)# end/;
  const match = regex.exec(pipedSourceManifest);

  if (!match) {
    return '';
  }

  return match![1];
};

/**
 * Runs the --help command when the entered command is incorrect.
 */
export const runHelpCommand = (command: string) => {
  const isGlobal = !!process.env.npm_config_global;
  const ifCommand = [
    isGlobal ? command : 'npm',
    ...(isGlobal ? ['--silent'] : ['run', command, '--silent']),
    '--',
    '-h',
  ];

  execFileSync(ifCommand[0], ifCommand.slice(1), {
    cwd: process.env.CURRENT_DIR || process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  process.exit(1);
};
