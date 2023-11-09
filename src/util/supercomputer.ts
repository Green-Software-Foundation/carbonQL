import {ModelsUniverse} from './models-universe';
import {Observatory} from './observatory';

import {ERRORS} from './errors';

import {STRINGS} from '../config';

import {ChildInformation} from '../types/supercomputer';
import {Children, Config, Impl, ModelParams} from '../types/impl';

const {ImplValidationError} = ERRORS;

const {STRUCTURE_MALFORMED} = STRINGS;

/**
 * Computer for `impl` documents.
 */
export class Supercomputer {
  private olderChild: ChildInformation = {name: '', info: {}};
  private impl: Impl;
  private modelsHandbook: ModelsUniverse;

  constructor(impl: Impl, modelsHandbook: ModelsUniverse) {
    this.impl = impl;
    this.modelsHandbook = modelsHandbook;
  }

  /**
   * Flattens config entries.
   */
  private flattenConfigValues(config: Config) {
    if (!config) {
      return {};
    }

    const configModelNames = Object.keys(config);
    const values = configModelNames.reduce((acc: any, name: string) => {
      acc = {
        ...acc,
        ...config[name],
      };

      return acc;
    }, {});

    return values;
  }

  /**
   * Adds config entries to each obsercation object passed.
   */
  private enrichInputs(
    inputs: ModelParams[],
    config: Config,
    nestedConfig: Config
  ) {
    const configValues = this.flattenConfigValues(config);
    const nestedConfigValues = this.flattenConfigValues(nestedConfig);

    return inputs.map((input: any) => ({
      ...input,
      ...configValues,
      ...nestedConfigValues,
    }));
  }

  /**
   * If child is top level, then initializes `this.olderChild`.
   * If `children` object contains `children` property, it means inputs are nested (calls compute again).
   * Otherwise enriches inputs, passes them to Observatory.
   * For each model from pipeline Observatory gathers inputs. Then results are stored.
   */
  private async calculateOutputsForChild(
    childrenObject: Children,
    params: any
  ) {
    const {childName, areChildrenNested} = params;

    if (!areChildrenNested) {
      if ('inputs' in this.impl.graph.children[childName]) {
        this.olderChild = {
          name: childName,
          info: this.impl.graph.children[childName],
        };
      }

      throw new ImplValidationError(STRUCTURE_MALFORMED(childName));
    }

    const {pipeline, inputs, config} = this.olderChild.info;

    if ('children' in childrenObject[childName]) {
      return this.compute(childrenObject[childName].children);
    }

    const specificInputs = areChildrenNested
      ? childrenObject[childName].inputs
      : inputs;

    const childrenConfig = childrenObject[childName].config || {};

    const enrichedInputs = this.enrichInputs(
      specificInputs,
      config,
      childrenConfig
    );

    const observatory = new Observatory(enrichedInputs);

    for (const modelName of pipeline) {
      const params = config && config[modelName];
      const modelInstance = await this.modelsHandbook.getInitializedModel(
        modelName,
        params
      );

      await observatory.doInvestigationsWith(modelInstance);
    }

    const outputs = observatory.getOutputs();

    if (areChildrenNested) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.impl.graph.children[this.olderChild.name].children[
        childName
      ].outputs = observatory.getOutputs();

      return;
    }

    this.impl.graph.children[this.olderChild.name].outputs = outputs;
    return;
  }

  /**
   * Checks if object is top level children or nested, then runs through all children and calculates outputs.
   */
  public async compute(childrenObject?: any) {
    const implOrChildren = childrenObject || this.impl;
    const areChildrenNested = !!childrenObject;
    const children: Children = areChildrenNested
      ? implOrChildren
      : implOrChildren.graph.children;
    const childrenNames = Object.keys(children);

    for (const childName of childrenNames) {
      await this.calculateOutputsForChild(children, {
        childName,
        areChildrenNested,
      });
    }

    return this.impl;
  }
}
