# Model Plugin Configuration

There are several places in an Impl file where you can add configuration for a model. 

- Observation
- Node (Grouping or Component) Config
- Root Config

There are also several function signatures to a Model Plugin. What are the rules and expectations for how we pass config to model plugins in the use and design of Model Plugins?

## Root Config

This configuration appears in the top level of an IMPL file, under the root config node like so:

```yaml
.
.
initialize:
  models:
    - name: <model-name-1>
      kind: 
      path: <path-to-ts-module-to-load>
      config:
	       <key>: <value>
    - name: <model-name-2>
      path: <path-to-ts-module-to-load>
      config:
	       <key>: <value>	       
.
.
graph: ~
```

We call each model in the root model config array above the `configure(name: string, config: Configuration)` function. We pass the name we are calling this model, and we pass the config as described in the root config.

Any configuration here should be:
- Global for the entire graph.
- Constant. It should not be used to provide default values for every node. If that's your desire, use node config at the graph's root.
- Anything related to one-time setup, e.g., authentication information.

## Observations

Ultimately, the observations are passed to the model through the `calculate(observations: Array<Observation>)` function. 

An essential characteristic of the Impact Engine is that the model is passed everything it needs to perform its calculation in the Observation nodes. All the data required to calculate an Observation exists in each Observation node. Ensuring all the required data is self-contained in an Observation makes building and testing models easier. 

As such, the most important place to put configuration that is directly related to the calculation of an Observation is in the Observation, like so: 

```yaml
backend:
  .
  .
  observations: 
    - timestamp: 2023-07-06T00:00
      duration: 5
      cpu-util: 33
      physical-processor: Intel Xeon Platinum 8175
    - timestamp: 2023-07-06T00:05
      duration: 5
      cpu-util: 23
      physical-processor: Intel Xeon Platinum 8175
    - timestamp: 2023-07-06T00:10
      duration: 5
      cpu-util: 11
      physical-processor: Intel Xeon Platinum 8175
```

In the above example, the model requires the *processor* to calculate each observation. So, every observation has the processor as one of its parameters.

Every observation has all the data needed to calculate that one observation. 

## Node Config

The above approach can be verbose, with the same data repeated across multiple observations. So, to make life easier when creating an IMPL file, you can also add configuration to *Node Configs*, like so:

```yaml
graph:
  children:
    backend:
      pipeline: 
        - model-1
      config: 
        model-1:
          physical-processor: Intel Xeon Platinum 8175
          thermal-design-power: 200
      observations: 
        - timestamp: 2023-07-06T00:00
          duration: 5
          cpu: 33
```

In the above example, we added config related to model-1 in the component node. Effectively, the config for the model is copied into every observation underneath. The reality of how this happens is more complex (see [Namespacing](#Namespacing) section for more info), but for brevity, we can describe the above as having this effect:

```yaml
graph:
  children:
    backend:
      pipeline: 
        - model-1
      config: 
        model-1:
          physical-processor: Intel Xeon Platinum 8175
          thermal-design-power: 200
      observations: 
        - timestamp: 2023-07-06T00:00
          duration: 5
          cpu: 33
          physical-processor: Intel Xeon Platinum 8175
          thermal-design-power: 200          
```

Ultimately, the observation must contain all the data required for its calculation with the model, so the config for model-1 is copied into every observation. 
## Namespacing

How do we handle the situation where there are two models, each with the same configuration params? One will overwrite the other. Models are dynamic, and most will be created outside of any governance or control of the IEF team, so we can't enforce that every config param is unique.

The solution is to namespace any config added into an observation and ensure that observations passed to a model only contain data in its namespace.

In the below example, the config for model-1 and model-2 at the component node level is added to the observation (with a namespace post-pended so we know where the config came from) like so:

```yaml
graph:
  children:
    backend:
      pipeline: 
        - model-1
      config: 
        model-1:
          verbose: true
        model-1:
          verbose: false
      observations: 
        - timestamp: 2023-07-06T00:00
          duration: 5
          cpu: 33
          verbose::model-1: true
          verbose::model-2: false
```

Both models use a param called `verbose` to signal how much data the model should export for debugging purposes, but for one it's set to true and the other false. 

We handle this by post-pending `::<name-of-model>` to the key and adding it to the observation. That way, model-1 and model-2 can have the same variable but different values.

But the model expects `verbose` to be passed into the calculate function, not `verbose::model-1`.

IEF ensures that for every model, it only passes in:
- Data that **isn't** associated with any namespace (i.e., data that doesn't end with `::<namespace>`)
- Data that **is only** associated with this model's namespace (i.e., data that ends with `::<this-models-name`):

For the above example, model-1 would effectively see this:

```yaml
observations: 
  - timestamp: 2023-07-06T00:00
    duration: 5
    cpu: 33
    verbose: true
```

And model-2 would see this:

```yaml
observations: 
  - timestamp: 2023-07-06T00:00
    duration: 5
    cpu: 33
    verbose: false
```

This way, there are no clashes with any configuration that shares the same names between models. Each model has its own namespace.

## Overriding

You can set configuration on many levels in the graph; lower level, deeper config, overrides the same config on higher levels of the graph. In the below example, `verbose` is configured in two places in the graph with different values.


```yaml
graph:
  config:
    model-1:
      verbose: false
      physical-processor: Intel Xeon Platinum 8175
backend:
  pipeline: 
    - model-1
  config: 
    model-1:
      verbose: true
      region: west-us
  observations: 
    - timestamp: 2023-07-06T00:00
      duration: 5
      cpu: 33
```

Eventually, what gets added to the graph is something like so:

```yaml
graph:
  config:
    model-1:
      verbose: false
      physical-processor: Intel Xeon Platinum 8175
backend:
  pipeline: 
    - model-1
  config: 
    model-1:
      verbose: true
      region: west-us
  observations: 
    - timestamp: 2023-07-06T00:00
      duration: 5
      cpu: 33
      verbose::model-1: true # set on both levels, but only the closest value taken
      region::model-1: west-us # set just on component node
      physical-processor::model-1: Intel Xeon Platinum 8175 # set on root node
```

The verbose param is set on two levels of the graph, but the lower level config overrides the higher level config.

In the end, however, model-1 is passed data without the `::model-1` data that's post-pended, like so:

```yaml
observations: 
  - timestamp: 2023-07-06T00:00
    duration: 5
    cpu: 33
    verbose: true # set on both levels, but only the closest value taken
    region: west-us # set just on component node
    physical-processor: Intel Xeon Platinum 8175 # set on the root node
```