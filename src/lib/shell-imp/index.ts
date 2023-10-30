import * as cp from 'child_process';
import * as yaml from 'js-yaml';

import {IoutputModelInterface} from '../interfaces';

import {CONFIG} from '../../config';

import {KeyValuePair} from '../../types/common';

const {MODEL_IDS} = CONFIG;
const {SHELL_MODEL} = MODEL_IDS;

export class ShellModel implements IoutputModelInterface {
  authParams: object | undefined; // Defined for compatibility. Not used.
  name: string | undefined; // The name of the data source.
  staticParams: object | undefined;
  executable = '';

  /**
   * Defined for compatibility. Not used.
   */
  authenticate(authParams: object): void {
    this.authParams = authParams;
  }

  /**
   * Configures the Plugin for IEF
   * @param {string} name name of the resource
   * @param {Object} staticParams static parameters for the resource
   * @param {number} staticParams.tdp Thermal Design Power in Watts
   */
  async configure(
    name: string,
    staticParams: object | undefined = undefined
  ): Promise<IoutputModelInterface> {
    this.name = name;
    if (staticParams === undefined) {
      throw new Error('Required staticParams not provided');
    }
    if ('executable' in staticParams) {
      this.executable = staticParams['executable'] as string;
      delete staticParams['executable'];
    }
    this.staticParams = staticParams;
    return this;
  }

  async execute(inputs: object | object[] | undefined): Promise<any[]> {
    if (inputs === undefined) {
      throw new Error('Required Parameters not provided');
    }

    const input: KeyValuePair = {};
    input['inputs'] = inputs;
    if (this.staticParams !== undefined) {
      input['config'] = this.staticParams;
    }

    const inputAsString: string = yaml.dump(input);

    const results = this.runModelInShell(inputAsString, this.executable);

    return results['outputs'];
  }

  /**
   * Returns model identifier
   */
  modelIdentifier(): string {
    return SHELL_MODEL;
  }

  /**
   * Runs the model in a shell. Spawns a child process to run an external IMP,
   *  expects `execPath` to be a path to an executable with a CLI exposing two methods: `--execute` and `--impl`.
   * The shell command then calls the `--command` method passing var impl as the path to the desired impl file.
   * @param input Yaml string (impl minus top level config).
   * @param {string} execPath Path to executable.
   * @param {string} omplName Savename for ompl file.
   * @returns - ompl data to stdout
   *          - ompl data to disk as omplName.yaml
   */
  private runModelInShell(input: string, execPath: string): KeyValuePair {
    try {
      const execs = execPath.split(' ');
      const executable = execs.shift() ?? '';

      const result = cp
        .spawnSync(executable, [...execs, '--execute'], {
          input: input,
          encoding: 'utf8',
        })
        .stdout.toString();
      return yaml.load(result) as KeyValuePair;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}
