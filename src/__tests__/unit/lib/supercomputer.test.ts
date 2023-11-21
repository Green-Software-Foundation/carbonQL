import {ModelsUniverse as MockModelUniverse} from '../../../__mocks__/model-universe';

jest.mock('../../../lib/models-universe', () => ({
  __esModule: true,
  ModelsUniverse: MockModelUniverse,
}));

import {Supercomputer} from '../../../lib/supercomputer';
import {ModelsUniverse} from '../../../lib/models-universe';

import {ERRORS} from '../../../util/errors';

import {STRINGS} from '../../../config';

const {ImplValidationError} = ERRORS;

const {NOT_INITIALIZED_MODEL, STRUCTURE_MALFORMED} = STRINGS;

describe('util/supercomputer: ', () => {
  const impl: any = {
    name: 'gsf-demo',
    description: 'Hello',
    tags: {
      kind: 'web',
      complexity: 'moderate',
      category: 'cloud',
    },
    initialize: {
      models: [
        {
          name: 'mock-name',
          kind: 'plugin',
          model: 'MockaviztaModel',
          config: {
            allocation: 'LINEAR',
            verbose: true,
          },
        },
      ],
    },
    graph: {
      children: {
        'front-end': {
          pipeline: ['mock-name'],
          config: {
            'mock-name': {
              'core-units': 24,
              processor: 'Intel® Core™ i7-1185G7',
            },
          },
          inputs: [
            {
              timestamp: '2023-07-06T00:00',
              duration: 3600,
              'cpu-util': 18.392,
            },
            {
              timestamp: '2023-08-06T00:00',
              duration: 3600,
              'cpu-util': 16,
            },
          ],
        },
      },
    },
  };

  describe('init Supercomputer: ', () => {
    it('initializes object with required properties.', () => {
      const impl: any = {};
      const modelsHandbook = new ModelsUniverse();
      const aterui = new Supercomputer(impl, modelsHandbook);

      expect(aterui).toHaveProperty('compute');
    });
  });

  describe('compute(): ', () => {
    const implWithNestedChildren: any = {
      name: 'ntt-data-on-premise',
      description:
        'https://github.com/Green-Software-Foundation/sci-guide/blob/dev/use-case-submissions/nttdatta-On-Premise-Web-system.md',
      tags: {
        kind: 'web',
        complexity: 'moderate',
        category: 'on-premise',
      },
      initialize: {
        models: [
          {
            name: 'sci-e',
            kind: 'plugin',
            verbose: false,
            path: '',
          },
          {
            name: 'sci-m',
            kind: 'plugin',
            verbose: false,
            path: '',
          },
          {
            name: 'sci-o',
            kind: 'plugin',
            verbose: false,
            path: '',
          },
        ],
      },
      graph: {
        children: {
          'layer-3-switch': {
            pipeline: ['sci-e', 'sci-m', 'sci-o'],
            config: {
              'sci-m': {
                te: 251000,
                tir: 3600,
                el: 126144000,
                rr: 1,
                tor: 1,
              },
              'sci-o': {
                'grid-carbon-intensity': 457,
              },
            },
            inputs: [
              {
                timestamp: '2023-07-06T00:00',
                duration: 3600,
                'five-min-input-rate': 100,
                'five-min-output-rate': 100,
                'grid-carbon-intensity': 457,
                'energy-network': 0.00496,
                requests: 38032740,
              },
            ],
          },
          'layer-2-switch': {
            pipeline: ['sci-e', 'sci-m', 'sci-o'],
            config: {
              'sci-m': {
                te: 251000,
                tir: 3600,
                el: 126144000,
                rr: 1,
                tor: 1,
              },
              'sci-o': {
                grid_ci: 457,
              },
            },
            children: {
              'switch-1': {
                inputs: [
                  {
                    timestamp: '2023-07-06T00:00',
                    duration: 1,
                    'energy-network': 0.000811,
                    'grid-carbon-intensity': 457,
                    requests: 38032740,
                  },
                ],
              },
              'switch-2': {
                inputs: [
                  {
                    timestamp: '2023-07-06T00:00',
                    duration: 1,
                    'energy-network': 0,
                    'grid-carbon-intensity': 457,
                    requests: 38032740,
                  },
                ],
              },
              'switch-3': {
                inputs: [
                  {
                    timestamp: '2023-07-06T00:00',
                    duration: 1,
                    'energy-network': 0.000955,
                    'grid-carbon-intensity': 457,
                    requests: 38032740,
                  },
                ],
              },
              'switch-4': {
                inputs: [
                  {
                    timestamp: '2023-07-06T00:00',
                    duration: 1,
                    'energy-network': 1.14e-8,
                    'grid-carbon-intensity': 457,
                    requests: 38032740,
                  },
                ],
              },
            },
          },
        },
      },
    };

    it('rejects with model is not initialized.', async () => {
      expect.assertions(2);

      const modelsHandbook = new ModelsUniverse();
      const aterui = new Supercomputer(impl, modelsHandbook);

      const expectedMessage = NOT_INITIALIZED_MODEL(
        impl.initialize.models[0].name
      );

      try {
        await aterui.compute();
      } catch (error) {
        if (error instanceof Error) {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe(expectedMessage);
        }
      }
    });

    it('applies computing to given impl.', async () => {
      expect.assertions(1);

      const modelsHandbook = new ModelsUniverse();
      impl.initialize.models.forEach((model: any) =>
        modelsHandbook.writeDown(model)
      );

      const ateruiComputer = new Supercomputer(impl, modelsHandbook);
      const ompl = await ateruiComputer.compute();

      const children = ompl.graph.children;
      const childrenNames = Object.keys(children);

      expect(ompl.graph.children[childrenNames[0]]).toHaveProperty('outputs');
    });

    it('applies computing to nested children components.', async () => {
      expect.assertions(4);

      const modelsHandbook = new ModelsUniverse();
      implWithNestedChildren.initialize.models.forEach((model: any) =>
        modelsHandbook.writeDown(model)
      );

      const ateruiComputer = new Supercomputer(
        implWithNestedChildren,
        modelsHandbook
      );
      const ompl = await ateruiComputer.compute();

      const children = ompl.graph.children;
      const childrenNames = Object.keys(children);
      const oneWithNested = childrenNames[1];

      const nestedChildren: any = children[oneWithNested].children;

      Object.keys(nestedChildren).forEach((child: any) => {
        expect(nestedChildren[child]).toHaveProperty('outputs');
      });
    });

    it('applies computing to nested children components if config is empty.', async () => {
      const implWithoutConfig = {
        ...impl,
        graph: {
          ...impl.graph,
          children: {
            ...impl.graph.children,
            'front-end': {
              ...impl.graph.children['front-end'],
              config: null,
            },
          },
        },
      };

      const modelsHandbook = new ModelsUniverse();

      for (const model of implWithoutConfig.initialize.models) {
        await modelsHandbook.writeDown(model);
      }

      const ateruiComputer = new Supercomputer(
        implWithoutConfig,
        modelsHandbook
      );

      const result = await ateruiComputer.compute();

      const expectedOutput = [{data: 'mock-data'}];

      expect(result.graph.children['front-end'].outputs).toEqual(
        expectedOutput
      );
    });

    it('throws `structure malformed` error if nested children component misses `inputs`.', async () => {
      const jsonObj = JSON.stringify(impl);
      const implCopy = JSON.parse(jsonObj);
      delete implCopy.graph.children['front-end'].inputs;

      const modelsHandbook = new ModelsUniverse();

      for (const model of implCopy.initialize.models) {
        await modelsHandbook.writeDown(model);
      }

      const ateruiComputer = new Supercomputer(implCopy, modelsHandbook);

      expect.assertions(2);

      try {
        await ateruiComputer.compute();
      } catch (error) {
        expect(error).toBeInstanceOf(ImplValidationError);
        if (error instanceof ImplValidationError) {
          expect(error.message).toEqual(STRUCTURE_MALFORMED('front-end'));
        }
      }
    });
  });
});
