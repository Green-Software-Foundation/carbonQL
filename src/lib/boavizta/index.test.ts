import {describe, expect, jest, test} from '@jest/globals';
import {BoaviztaCloudImpactModel, BoaviztaCpuImpactModel} from './index';
import axios from 'axios';
import * as PROVIDERS from '../../__mocks__/boavizta/providers.json';
import * as COUNTRIES from '../../__mocks__/boavizta/countries.json';
import * as INSTANCE_TYPES from '../../__mocks__/boavizta/instance_types.json';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;
// Mock out all top level functions, such as get, put, delete and post:
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
mockAxios.get.mockImplementation(url => {
  switch (url) {
    case 'https://api.boavizta.org/v1/cloud/all_providers':
      return Promise.resolve({data: PROVIDERS});
    case 'https://api.boavizta.org/v1/utils/country_code':
      return Promise.resolve({data: COUNTRIES});
    case 'https://api.boavizta.org/v1/cloud/all_instances?provider=aws':
      return Promise.resolve({
        data: INSTANCE_TYPES['aws'],
      });
  }
});
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
mockAxios.post.mockImplementation(url => {
  switch (url) {
    case 'https://api.boavizta.org/v1/component/cpu?verbose=false&allocation=LINEAR':
      return Promise.resolve({
        data: {
          gwp: {manufacture: 0.1, use: 1.0, unit: 'kgCO2eq'},
          pe: {manufacture: 0.1, use: 1.0, unit: 'MJ'},
        },
      });
    case 'https://api.boavizta.org/v1/cloud/?verbose=false&allocation=LINEAR':
      return Promise.resolve({
        data: {
          gwp: {manufacture: 0.1, use: 1.0, unit: 'kgCO2eq'},
          pe: {manufacture: 0.1, use: 1.0, unit: 'MJ'},
        },
      });
  }
});
jest.setTimeout(30000);
describe('cpu:configure test', () => {
  test('initialize wrong params should throw error', async () => {
    const impactModel = new BoaviztaCpuImpactModel();

    await expect(
      impactModel.configure('test', {allocation: 'wrong'})
    ).rejects.toThrowError();
    expect(impactModel.name).toBe('test');
  });

  test('initialize without params throws error for parameter and call calculate without params throws error for observation', async () => {
    const impactModel = new BoaviztaCpuImpactModel();

    await expect(impactModel.configure('test')).rejects.toThrow(
      Error('Improper configure: Missing processor parameter')
    );
    expect(impactModel.name).toBe('test');
    // not providing observations will throw a missing observations error
    await expect(impactModel.calculate()).rejects.toStrictEqual(
      Error(
        'Parameter Not Given: invalid observations parameter. Expecting an array of observations'
      )
    );
    // improper observations will throw a invalid observations error
    await expect(
      impactModel.calculate([{invalid: 'observation'}])
    ).rejects.toStrictEqual(
      Error('Invalid Input: Invalid observations parameter')
    );
  });
});

describe('cpu:initialize with params', () => {
  test('initialize with params and call multiple usages in IMPL format', async () => {
    const impactModel = new BoaviztaCpuImpactModel();
    await expect(
      impactModel.configure('test', {
        'physical-processor': 'Intel Xeon Gold 6138f',
        'core-units': 24,
        location: 'USA',
      })
    ).resolves.toBeInstanceOf(BoaviztaCpuImpactModel);
    expect(impactModel.name).toBe('test');
    // configure without static params will cause improper configure error
    await expect(
      impactModel.calculate([
        {
          timestamp: '2021-01-01T00:00:00Z',
          duration: 3600,
          'cpu-util': 0.5,
        },
      ])
    ).resolves.toStrictEqual([
      {
        'embodied-carbon': 100,
        'e-cpu': 0.2777777777777778,
      },
    ]);
  });
});

describe('cloud:initialize with params', () => {
  test('initialize with params and call usage in RAW Format', async () => {
    const impactModel = new BoaviztaCloudImpactModel();

    await expect(
      impactModel.configure('test', {
        instance_type: 't2.micro',
        location: 'USA',
        provider: 'aws',
      })
    ).resolves.toBeInstanceOf(BoaviztaCloudImpactModel);
    expect(impactModel.name).toBe('test');
    // configure without static params will cause improper configure error
  });

  test('correct instance_type: initialize with params and call usage in IMPL Format', async () => {
    const impactModel = new BoaviztaCloudImpactModel();

    await expect(
      impactModel.configure('test', {
        instance_type: 't2.micro',
        location: 'USA',
        provider: 'aws',
      })
    ).resolves.toBeInstanceOf(BoaviztaCloudImpactModel);
    expect(impactModel.name).toBe('test');
    // mockAxios.get.mockResolvedValue({data: {}});
    await expect(
      impactModel.calculate([
        {
          timestamp: '2021-01-01T00:00:00Z',
          duration: 15,
          'cpu-util': 0.34,
        },
      ])
    ).resolves.toStrictEqual([
      {
        'embodied-carbon': 100,
        energy: 0.2777777777777778,
      },
    ]);
  });

  test('wrong instance_type: initialize with params and call usage in IMPL Format throws error', async () => {
    const impactModel = new BoaviztaCloudImpactModel();

    await expect(
      impactModel.configure('test', {
        instance_type: 't5.micro',
        location: 'USA',
        provider: 'aws',
      })
    ).rejects.toThrowError();
    expect(impactModel.name).toBe('test');
    // configure without static params will cause improper configure error
    await expect(
      impactModel.calculate([
        {
          timestamp: '2021-01-01T00:00:00Z',
          duration: 15,
          'cpu-util': 0.34,
        },
        {
          timestamp: '2021-01-01T00:00:15Z',
          duration: 15,
          'cpu-util': 0.12,
        },
        {
          timestamp: '2021-01-01T00:00:30Z',
          duration: 15,
          'cpu-util': 0.01,
        },
        {
          timestamp: '2021-01-01T00:00:45Z',
          duration: 15,
          'cpu-util': 0.78,
        },
      ])
    ).rejects.toThrowError();
  });

  test('without instance_type: initialize with params and call usage in IMPL Format throws error', async () => {
    const impactModel = new BoaviztaCloudImpactModel();

    await expect(
      impactModel.configure('test', {
        location: 'USA',
        provider: 'aws',
      })
    ).rejects.toStrictEqual(
      Error('Improper configure: Missing instance_type parameter')
    );
    expect(impactModel.name).toBe('test');
    // configure without static params will cause improper configure error
    await expect(
      impactModel.calculate([
        {
          timestamp: '2021-01-01T00:00:00Z',
          duration: 15,
          'cpu-util': 0.34,
        },
        {
          timestamp: '2021-01-01T00:00:15Z',
          duration: 15,
          'cpu-util': 0.12,
        },
        {
          timestamp: '2021-01-01T00:00:30Z',
          duration: 15,
          'cpu-util': 0.01,
        },
        {
          timestamp: '2021-01-01T00:00:45Z',
          duration: 15,
          'cpu-util': 0.78,
        },
      ])
    ).rejects.toStrictEqual(
      Error('Improper configure: Missing configuration parameters')
    );
  });
});
