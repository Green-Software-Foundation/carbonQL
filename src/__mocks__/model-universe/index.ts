import {IOutputModelInterface} from '../../lib';

import {STRINGS} from '../../config';

import {
  ImplInitializeModel,
  InitalizedModels,
} from '../../types/models-universe';

const {NOT_INITIALIZED_MODEL} = STRINGS;

export class MockModel implements IOutputModelInterface {
  modelIdentifier(): string {
    return 'mock';
  }

  configure(): Promise<IOutputModelInterface> {
    return Promise.resolve(this);
  }
  execute(): Promise<any[]> {
    return Promise.resolve([{data: 'mock-data'}]);
  }
  authenticate(): void {}
}

/**
 * Models Initialization Lifecycle.
 */
export class ModelsUniverse {
  /**
   * Models list.
   */
  public initalizedModels: InitalizedModels = {};

  /**
   * Gets model class by provided `name` param.
   */
  private handBuiltinModel() {
    return MockModel;
  }

  /**
   * Gets model based on `name` and `kind` params.
   */
  private handModelByCriteria() {
    return this.handBuiltinModel();
  }

  /**
   * Initializes and registers model.
   */
  public writeDown(model: ImplInitializeModel) {
    const {name} = model;

    const Model = this.handModelByCriteria();

    const callback = async () => {
      const initalizedModel = await new Model().configure();

      return initalizedModel;
    };

    this.initalizedModels = {
      ...this.initalizedModels,
      [name]: callback,
    };

    return this.initalizedModels;
  }

  /**
   * Returns existing model by `name`.
   */
  public async getInitializedModel(modelName: string, config: any) {
    if (this.initalizedModels[modelName]) {
      return await this.initalizedModels[modelName](config);
    }

    throw new Error(NOT_INITIALIZED_MODEL(modelName));
  }
}
