# Interpolation Plugin

## Overview

Interpolation is a way to infer new data points from a previously known set of points.
This plugin implements linear interpolation by default for estimating energy consumption.

## Usage

To employ the `Interpolation` plugin, adhere to these steps:

1. **Initialize Plugin**: Import the `Interpolation` function and initialize it with global configuration parameters `method`, `x`, `y`, `input-parameter` and `output-parameter`.

2. **Execute Plugin**: Invoke the `execute` method of the initialized plugin instance with an array of input parameters. Each input parameter should include a `timestamp`, `duration` and `[input-parameter]` information.

3. **Result**: The plugin will return an array of plugin parameters enriched with the calculated average carbon intensity for each input.

## Global Config

- `method`: specifies the interpolation method for the data. Acceptable values are 'linear', 'spline', or 'polynomial'. The default method is linear. (optional)
- `x`: array of x points. Numbers should be in ascending order (required).
- `y`: array of y points. Numbers should be in ascending order (required).
- `input-parameter`: a string defining the name to use its value to calculate the interpolation. It should match an existing key in the inputs array (required).
- `output-parameter`: a string defining the name to use to add the result of interpolation with additional calculation (required).

Counts of `x` and `y` arrays elements should be equal.

## Input Parameters

The plugin expects the following input parameters:

- `timestamp`: a timestamp for the input (required)
- `duration`: the amount of time, in seconds, that the input covers. (required)
- `[input-parameter]` - a field whose name matches the string provided to input-parameter in global config (i.e. if the input-parameter in global config is cpu/utilisation then cpu-utilisation must exist in the input data)
- `vcpus-allocated`: number of allocated virtual CPUs (optional)
- `vcpus-total`: number of total virtual CPUs (optional)

If `vcpus-allocated` and `vcpus-total` are provided, these data will be used to scale the CPU energy usage.

## Output

The plugin outputs a value `z` that is the result of looking up the `y` value at `x = 'input-parameter'` using the user-defined interpolation method in `kWh` units. `z` is assigned to a field with a name defined by `output-parameter` in the output data.

## Error Handling

The plugin conducts input validation using the `zod` library and may throw errors if the provided parameters are invalid.

## Plugin Algorithm

1. **Execution**:

   - Validate Global config

     - `method` - validates if the method is one of these methods: `linear`, `spline`, or `polynomial`. If the method isn’t provided, it sets to `linear`.
     - `x` and `y` should be arrays of numbers, the length should be equal, and elements should be ordered in the ascendant order.
     - `input-parameter` - validates if the parameter is string.
     - `output-parameter` - validates if the parameter is string.

   - Iterate through each input, and do corresponding validation and calculation.

   - Validate input parameters

     - `duration` - validate if the duration is a number
     - `timestamp` - should be in string or date format
     - `[input-parameter]` - validates whether the parameter name is included in the input, and if its value should be a number within the range of x points.

     If the `vcpus-allocated` and `vcpus-total` are provided, the `vcpus-total` should be greater than `vcpus-allocated`. The `vcpus-allocated` should be greater than or equal to 1.

   - Calculation

     - If the `method` is provided, choose the right way to calculate. For the `linear` and `polynomial` methods, calculate according to their formulas. For spline interpolation, use the npm module `typescript-cubic-spline`.

   The result is multiplied by the `duration` and divided by 3600 to get seconds in an hour, then divided by 1000 to get kilowatt-hours (kWh):

   `(wattage * duration) / (seconds in an hour) / 1000 = kWh`

   If `vcpus-allocated` and `vcpus-total` are provided, the result is multiplied by their division
   `energy * (vcpus-total / vcpus-allocated)`

2. **Output**: Output the provided input along with the calculated `cpu/energy`, formatted in `kWh` units.

### TypeScript Usage

```ts
const globalConfig = {
  method: 'linear',
  x: [0, 10, 50, 100],
  y: [0.12, 0.32, 0.75, 1.02],
  'input-parameter': 'cpu/utilization'
  'output-parameter': 'cpu/energy'

};

const interpolationPlugin = Interpolation(globalConfig);

const inputs = [
  {
    timestamp: '2024-04-16T12:00:00Z',
    duration: 3600,
    'cpu/utilization': 45,
    'vcpus-allocated': 4,
    'vcpus-total': 8,
  },
];

const results = interpolationPlugin.execute(inputs);

console.log(results);
```

### Manifest Usage

#### Input

```yaml
name: interpolation-demo
description: simple demo of interpolation plugin
tags:
initialize:
  outputs:
    - yaml
  plugins:
    interpolation:
      method: Interpolation
      path: 'builtin'
      global-config:
        method: linear
        x: [0, 10, 50, 100]
        y: [0.12, 0.32, 0.75, 1.02]
        input-parameter: 'cpu/utilization'
        output-parameter: 'cpu/energy'
tree:
  children:
    child:
      pipeline:
        - interpolation
      inputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cpu/utilization: 45
```

#### Output

```yaml
name: interpolation-demo
description: simple demo of interpolation plugin
tags:
initialize:
  outputs:
    - yaml
  plugins:
    interpolation:
      method: Interpolation
      path: 'builtin'
      global-config:
        method: linear
        x: [0, 10, 50, 100]
        y: [0.12, 0.32, 0.75, 1.02]
        input-parameter: 'cpu/utilization'
        output-parameter: 'cpu/energy'
tree:
  children:
    child:
      pipeline:
        - interpolation
      inputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cpu/utilization: 45
      outputs:
        - timestamp: 2023-07-06T00:00
          duration: 3600
          cpu/utilization: 45
          cpu/energy: 0.00069625
```

You can execute this by passing it to `ie`. Run the impact using the following command from the project root:

```sh
npm i -g @grnsft/if
ie --manifest ./manifests/examples/interpolation.yml --output ./manifests/outputs/interpolation.yml
```