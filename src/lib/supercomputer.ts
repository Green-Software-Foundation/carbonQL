import {ModelsUniverse} from './models-universe';
import {Observatory} from './observatory';
import {aggregate} from './aggregator';
import {ERRORS} from '../util/errors';
import {STRINGS} from '../config';
import {Parameter} from '../types/units';
import {parameters} from '../config/params';
const fs = require('fs');

import {
  Config,
  ChildStructure,
  ParentNode,
  ParentStructure,
  Impl,
  isNodeParent,
  hasChildren,
  hasInputs,
} from '../types/impl';
import {ModelParams} from '../types/model-interface';
import {warn} from 'console';

const {ImplValidationError} = ERRORS;

const {STRUCTURE_MALFORMED} = STRINGS;

/**
 * Computer for `impl` documents.
 */
export class Supercomputer {
  private parent!: ParentNode;
  private impl: Impl;
  private aggregatedValues: ModelParams[] = [];
  private modelsHandbook: ModelsUniverse;
  private childAmount = 0;
  private parameters: Object = {};
  private overrideParamsPath: string | undefined;

  constructor(
    impl: Impl,
    modelsHandbook: ModelsUniverse,
    overrideParams?: string
  ) {
    this.impl = impl;
    this.modelsHandbook = modelsHandbook;
    this.overrideParamsPath = overrideParams;
  }

  /**
   * Checks if override params path is passed, then reads that file.
   * Then checks if param is new, then appends it to existing parameters.
   * Otherwise warns user about rejected overriding.
   */
  public async synchronizeParameters() {
    if (this.overrideParamsPath) {
      const newParams = JSON.parse(
        fs.readFileSync(this.overrideParamsPath, 'utf-8')
      );
      this.parameters = newParams;
    }

    if (this.impl.params) {
      const implParams = this.impl.params as Parameter[];

      implParams.forEach(param => {
        if (`${param.name}` in parameters) {
          warn(`Rejecting overriding of canonical parameter: ${param.name}.`);
          return;
        }

        this.parameters = {
          ...this.parameters,
          [`${param.name}`]: {
            description: param.description,
            unit: param.unit,
            aggregation: 'sum',
          },
        };
      });
    }
  }

  /**
   * Flattens config entries.
   */
  private flattenConfigValues(config: Config): ModelParams {
    const configValues = Object.values(config);
    return configValues.reduce((acc, value) => ({...acc, ...value}), {});
  }

  /**
   * Adds config entries to each obsercation object passed.
   */
  private enrichInputs(inputs: ModelParams[], config: Config) {
    const configValues = this.flattenConfigValues(config);

    return inputs.map((input: any) => ({
      ...input,
      ...configValues,
    }));
  }

  /**
   * If `children` object contains `children` property, it means inputs are nested (calls compute recursively).
   * Otherwise enriches inputs, passes them to Observatory.
   * For each model from pipeline Observatory gathers inputs. Then results are stored.
   */
  private async calculateOutputsFor(
    childen: ChildStructure | ParentStructure,
    name: string
  ) {
    const pointedChild = childen[name];

    if (hasChildren(pointedChild)) {
      return this.compute(pointedChild.children);
    }

    if (!(hasChildren(pointedChild) || hasInputs(pointedChild))) {
      throw new ImplValidationError(STRUCTURE_MALFORMED(name));
    }

    this.childAmount++;

    const {pipeline} = this.parent;
    const {inputs, config} = pointedChild;

    const enrichedInputs = this.enrichInputs(inputs, {
      ...this.parent.config,
      ...config,
    });
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
    pointedChild.outputs = outputs;

    /** If aggregation is enabled, do horizontal aggregation. */
    if (this.impl.aggregation) {
      const {type, metrics} = this.impl.aggregation;

      if (type === 'horizontal' || type === 'both') {
        const aggregation = await aggregate(outputs, metrics);
        pointedChild['aggregated-outputs'] = aggregation;

        this.aggregatedValues.push(aggregation);
      }
    }

    return;
  }

  /**
   * Checks if children argument is present.
   * If it's not, then iteration is on parent level so stores the parent.
   * Otherwise iterates over child components.
   */
  public async compute(children?: ChildStructure) {
    const pointedChildren = children || this.impl.graph.children;
    const childrensNames = Object.keys(pointedChildren);

    for (const name of childrensNames) {
      if (!children && isNodeParent(pointedChildren, children)) {
        this.parent = pointedChildren[name];
      }

      await this.calculateOutputsFor(pointedChildren, name);
    }

    return this.impl;
  }
}
