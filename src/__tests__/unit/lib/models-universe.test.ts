import {MockModel} from '../../../__mocks__/model-universe';

import {ModelsUniverse} from '../../../lib/models-universe';
import {ERRORS} from '../../../util/errors';

import {STRINGS} from '../../../config';

import {ImplInitializeModel} from '../../../types/models-universe';

const {ModelInitializationError} = ERRORS;

const {
  MISSING_CLASSNAME,
  MISSING_PATH,
  NOT_INITIALIZED_MODEL,
  NOT_NATIVE_MODEL,
  NOT_MODEL_PLUGIN_EXTENSION,
  NOT_CONSTRUCTABLE_MODEL,
  INVALID_MODULE_PATH,
} = STRINGS;

describe('util/models-universe: ', () => {
  describe('init ModelsUniverse', () => {
    it('initializes object with required properties.', () => {
      const modelsHandbook = new ModelsUniverse();

      expect(typeof modelsHandbook.getInitializedModel).toBe('function');
      expect(typeof modelsHandbook.initalizedModels).toBe('object');
      expect(typeof modelsHandbook.writeDown).toBe('function');
      expect(modelsHandbook.initalizedModels).toEqual({});
    });
  });

  describe('writeDown(): ', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });

    it('throws `missing classname` error in case if classname/model is missing.', async () => {
      const modelsHandbook = new ModelsUniverse();
      const modelInfo: ImplInitializeModel = {
        config: {},
        name: 'test',
      };

      try {
        await modelsHandbook.writeDown(modelInfo);
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toEqual(MISSING_CLASSNAME);
        }
      }
    });

    it('throws `missing path parameter` error while registration of `plugin` model.', async () => {
      const modelsHandbook = new ModelsUniverse();
      const modelInfo: ImplInitializeModel = {
        config: {
          allocation: 'mock-allocation',
          verbose: true,
        },
        name: 'mock-name',
        model: 'MockaviztaModel',
      };

      expect.assertions(2);

      try {
        await modelsHandbook.writeDown(modelInfo);
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toEqual(MISSING_PATH);
        }
      }
    });

    it('should successfully initalize plugin model.', async () => {
      jest.mock(
        'mockavizta-model',
        () => ({
          __esModule: true,
          MockaviztaModel: MockModel,
        }),
        {virtual: true}
      );

      /**
       * Mock `console.log` to check if not native model.
       */
      const originalLog = console.log;
      const mockLog = jest.fn();
      console.log = mockLog;

      const modelsHandbook = new ModelsUniverse();
      const modelInfo: ImplInitializeModel = {
        config: {
          allocation: 'mock-allocation',
          verbose: true,
        },
        name: 'mock-name',
        model: 'MockaviztaModel',
        path: 'https://github.com/mock/mockavizta-model',
      };

      const modelsList = await modelsHandbook.writeDown(modelInfo);
      const model = modelsList[modelInfo.name];

      expect.assertions(2);

      const response = await model({
        'core-units': 1,
        'physical-processor': 'intel',
      });

      expect(mockLog).toHaveBeenCalledWith(NOT_NATIVE_MODEL);
      expect(response).toBeInstanceOf(MockModel);

      console.log = originalLog;
    });

    it('should throw `input model does not extend base interface` error.', async () => {
      jest.mock(
        'mockavizta-model',
        () => ({
          __esModule: true,
          MockaviztaModel: class FakeModel {},
        }),
        {virtual: true}
      );

      const modelsHandbook = new ModelsUniverse();
      const modelInfo: ImplInitializeModel = {
        config: {
          allocation: 'mock-allocation',
          verbose: true,
        },
        name: 'mock-name',
        model: 'MockaviztaModel',
        path: 'https://github.com/mock/mockavizta-model',
      };
      expect.assertions(2);

      try {
        const modelsList = await modelsHandbook.writeDown(modelInfo);
        const model = modelsList[modelInfo.name];

        await model({
          'core-units': 1,
          'physical-processor': 'intel',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ModelInitializationError);

        if (error instanceof ModelInitializationError) {
          expect(error.message).toEqual(NOT_MODEL_PLUGIN_EXTENSION);
        }
      }
    });

    it('should throw `not constructable model` error if provided model is not a class.', async () => {
      jest.mock(
        'mockavizta-model',
        () => ({
          __esModule: true,
          MockaviztaModel: {},
        }),
        {virtual: true}
      );

      const modelsHandbook = new ModelsUniverse();
      const modelInfo = {
        config: {
          allocation: 'mock-allocation',
          verbose: true,
        },
        name: 'mock-name',
        model: 'MockaviztaModel',
        path: 'https://github.com/mock/mockavizta-model',
      };
      expect.assertions(2);

      /**
       * Parses module from github repo.
       */
      const parts = modelInfo.path.split('/');
      const path = parts[parts.length - 1];

      try {
        await modelsHandbook.writeDown(modelInfo);
      } catch (error) {
        expect(error).toBeInstanceOf(ModelInitializationError);

        if (error instanceof ModelInitializationError) {
          expect(error.message).toEqual(
            NOT_CONSTRUCTABLE_MODEL({
              model: modelInfo.model,
              path,
            })
          );
        }
      }
    });

    it('should throw `invalid module path` error if provided path is invalid.', async () => {
      const modelsHandbook = new ModelsUniverse();
      const modelInfo = {
        config: {
          allocation: 'mock-allocation',
          verbose: true,
        },
        name: 'mock-name',
        model: 'MockaviztaModel',
        path: 'mock-module',
      };
      expect.assertions(2);

      /**
       * Parses module from github repo.
       */
      const parts = modelInfo.path.split('/');
      const path = parts[parts.length - 1];

      try {
        await modelsHandbook.writeDown(modelInfo);
      } catch (error) {
        expect(error).toBeInstanceOf(ModelInitializationError);

        if (error instanceof ModelInitializationError) {
          expect(error.message).toEqual(INVALID_MODULE_PATH(path));
        }
      }
    });
  });

  describe('getInitializedModel(): ', () => {
    it('throws error in case if model is not initalized.', async () => {
      const modelsHandbook = new ModelsUniverse();

      const modelName = 'mock-modelName';
      const config = {};

      const expectedMessage = NOT_INITIALIZED_MODEL(modelName);

      try {
        await modelsHandbook.getInitializedModel(modelName, config);
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toEqual(expectedMessage);
        }
      }
    });
  });

  it('successfully return initialized model.', async () => {
    jest.mock(
      'mockavizta-model',
      () => ({
        __esModule: true,
        MockaviztaModel: MockModel,
      }),
      {virtual: true}
    );

    const modelsHandbook = new ModelsUniverse();
    const modelInfo: ImplInitializeModel = {
      config: {
        allocation: 'mock-allocation',
        verbose: true,
      },
      name: 'mock-name',
      model: 'MockaviztaModel',
      path: 'https://github.com/mock/mockavizta-model',
    };

    await modelsHandbook.writeDown(modelInfo);
    const model = await modelsHandbook.getInitializedModel(modelInfo.name, {});

    expect.assertions(1);

    expect(model).toBeInstanceOf(MockModel);
  });
});
