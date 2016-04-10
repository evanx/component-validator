
## My lightweight ES2016 component specification

I wish to formalise a basic component model for some of my Node projects, where I find myself re-implementing the same component framework for configuration and lifecycle management. I wish to abstract a common specification here, and implement this as a re-usable module.

This component model must support:
- third-party plugin components e.g. from independent repos on Github et al.
- `async` lifecycle functions that should resolve within a configured interval.
- initialisation of a component with its configuration and dependencies e.g. `init(state).`
- lifecycle hooks e.g. `start()` and `end()` e.g. for graceful shutdown.
- ES2016 async/await
- reduced boilerplate code


###### Class example

Expressed as an ES6 `class` with ES'16 `async` functions:
```javascript
export default class HelloComponent {
   async init(state) {
      Object.assign(this, state);
      this.logger.info('hello', this.config, Object.keys(this.context));
   }
   async start() {
      this.logger.info('system initialised');
   }
   async end() {
      this.logger.info('goodbye');
   }
}
```
where `logger` et al are provided via the `state` object, which we casually `Object.assign` into `this.`


###### Function example

Expressed as an `async` function:
```javascript
export async function createHelloComponent({config, logger}) {
   logger.info('hello', config);
   return {
      async start() {
         logger.info('system initialised');
      },
      async end() {
         logger.info('goodbye';      
      }
   };
}
```
where `config` and `logger` are destructured from the `state` object.

Incidently, an ES6 `class` implementation is expressed as an equivalent function as follows:
```javascript
export async function initComponent(componentClass, state) {
   const component = new componentClass(state);
   if (component.init) {
      assert(lodash.isFunction(component.init), 'init function');
      await component.init(state);
   }
   return component;
}
```
where the `state` is passed to the constructor also, since the component might choose to perform some initialisation in its constructor. The `init()` function is effectively a complementary "promisified constructor."

### Decorators

ES2016 decorators should be supported for validation metadata e.g.:
```javascript
export class HelloComponentconfig {

      @url
      redis = 'redis://localhost:6379/0';      

      @seconds @min(1) @max(30)
      started;
}
```

Equivalently via YAML e.g. `HelloClass.config.yaml:`
```yaml
config:
   redis:
      type: url
      defaultValue: redis://localhost:6379/0
   message:
      defaultValue: Hello, World
   started:
      type: timestamp
   timeout:
      type: interval
      unit: seconds
      defaultValue: 10
      min: 1
      max: 30
```
where these decorators are used by the component supervisor to default and validate config.

Similarly, `context` dependencies should be declared:
```yaml
context:
   metrics:
      type: component
   redisClient:
      optional: true
```

Before calling `start(),` the component supervisor must validate the `context` requirements, and initialise all components therein.

#### Declaring state props

Experimentally speaking, we might declare the (initial) `state` properties of the class:
```yaml
state:
   startedComponents: []
   components: {}
   requiredComponents: []
   startTimestamp: {}
   ended: false
```
In this case, we might preprocess the ES6 class to automatically insert `this` dereferencing in the source for the declared properties:
```javascript
await ClassPreprocessor.build(
   componentSourceFile,
   ['config', 'logger', 'context'].concat(
      Object.keys(componentMeta.state)
   )
);
```
However generally speaking this is a rather dangerous transform. Therefore class must be implemented such that any references to the declared state props names, are strictly intended for `this.`

and we initialise the class as follows:
```javascript
await component.init(Object.assign(
   {logger, config, context},
   componentMeta.state
));
```
where we coalesce the declared `state` props.

Our component class can then be coded as follows:
```javascript
export default class HelloComponent {
   async init() {
      logger.info('hello', config, Object.keys(context));
   }
   async start() {
      logger.info('system initialised');
   }
   async end() {
      logger.info('goodbye');
   }
}
```
where:
- references to `logger` et al are preprocessed into `this.logger` e.g. via a Babel transform plugin.
- we automatically `Object.assign` the `state` on the class

### Lifecycle functions

The lifecycle functions:
- must return an ES6 `Promise` i.e. to support ES2016 async/await
- should resolve/reject within a configured timeout e.g. 8 seconds by default.
- must be called at most once
- must be called by the supervisor only
- are not necessarily idempotent, insomuch as they are called at most once


#### `init({name, logger, config, metrics, context})`

This is called to initialise the component with a `state` object containing:
- `name` - the component's unique instance name
- `logger` - a logger configured with the component's name
- `metrics` - a metrics aggregator configured with the component's name
- `config` - the immutable configuration of the component
- `context` - for dependencies e.g. other required components

Notes:
- The component might open a network connection here, e.g. to Redis.

#### `start()`

Called after this component and its dependencies have been initialised successfully

Notes:
- The component might open a network connection here, e.g. to Redis.

#### `end()`

Called to shutdown the component e.g. for a graceful system exit.

Notes:
- the component should close any connections here, e.g. so that Node can exit.
- the component supervisor is responsible for ending all components in the event of an error.
- the component should not `end()` itself or other components.
- the component should signal a "fatal" error via `context.error(err, this)` to trigger a shutdown


### Scheduling

For convenience, the supervisor must `setTimeout` and `setInterval` on behalf of a component so configured.

Note that if `start()` was rejected, then no scheduling is performed.


##### `scheduledTimeout()`

If a `scheduledTimeout` (seconds) is configured via the component `config,` then this function must be defined.

Its invariants might be declared in YAML as follows:
```yaml
config:
   scheduledTimeout:
      interval: seconds      
   scheduledTimeoutWarn:
      defaultValue: false
      type: boolean
      optional: true
```

The `scheduledTimeout()` function is called via `setTimeout()` after the specified timeout period has elapsed since `start()` was resolved.

The supervisor might implement this as follows:
```javascript
   scheduleComponentTimeout(component, {name, config, logger, context}) {
      if (config.scheduledTimeout) {
         assert(typeof component.scheduledTimeout === 'function', 'scheduledTimeout: ' + name);
         this.scheduledTimeouts[name] = setTimeout(async () => {
            try {
               async component.scheduledTimeout();
            } catch (err) {               
               if (config.scheduledTimeoutWarn) {
                  logger.warn(err, component.name, config);
               } else {
                  context.error(err, component);                  
               }
            }
         }, config.scheduledTimeout);
      }
   }
```
where the component can be configured to just `logger.warn()` in event of a `scheduledTimeout` error. This overrides the default behavior, which is system shutdown, as the safest option.

Before the supervisor calls a component's `end()` function, it must `clearTimeout()`


##### `scheduledInterval()`

If a `scheduledInterval` (seconds) is configured via the component `config,` then this function must be defined.

Its invariants might be declared in YAML as follows:
```yaml
config:
   scheduledInterval:
      interval: seconds      
   scheduledIntervalWarn:
      defaultValue: false
      type: boolean
      optional: true
```

This lifecycle function is called via `setInterval()` e.g. scheduled by the supervisor as follows:
```javascript
   scheduleComponentInterval(component, {name, config, logger, context}) {
      if (config.scheduledInterval) {
         assert(typeof component.scheduledInterval === 'function', 'scheduledInterval: ' + name);
         this.scheduledIntervals[name] = setInterval(async () => {
            try {
               async component.scheduledInterval();
            } catch (err) {
               if (config.scheduledIntervalWarn) {
                  logger.warn(err, component.name, config);
               } else {
                  clearInterval(this.scheduledIntervals[name]);
                  context.error(err, component);                  
               }
            }
         }, config.scheduledInterval);
      }
   }
```
where the component can be configured to just `logger.warn()` in the event of an error. This overrides the default behavior, which is system shutdown, as the safest option.

Before the supervisor calls a component's `end()` function, is must first call `clearInterval()` - and later `clearTimeout()` if both are configured.


### Specification

STATUS: DESIGN STAGE

#### Supervisor singleton

- supports declarative defaults of system and component configuration properties.
- supports declarative validation of customisable properties.
- supports programmable system configuration "transforms" that provide constituent component configurations.
- supports using third-party tools such as `gulp` for configuration pipelines
- initialises each required component as per its required configuration properties and context dependencies.
- advises components to `start` when the system is ready e.g. all components have been successfully initialised
- initiates a graceful shutdown of all components
- supports multiple instances of the same component
- supports scheduling components at various times/intervals

#### Component instance

- is assigned a name e.g. for configuration and logging
- is provided with a logger
- is provided with a metrics aggregator e.g. to count events, record averages, peak values, distributions for histograms, etc.
- is configured with a set of `config` which must be considered immutable
- is provided with other dependencies via a `context` object
- is initialised with a `state` object which includes `{name, config, logger, context, metrics}`
- has lifecycle hooks including `start` and `end`


#### Metrics aggregator

- counts events
- somehow publishes/pushes metrics for monitoring purposes e.g. to Prometheus, Influx, Redis, et al.
- optionally aggregates values to record the average, peak, and distribution for histograms
- operates in tandem with the same logger, e.g. generates some logs on behalf of the component.


### Earlier component supervisor implementations

Note that the component supervisor implementation is yet to be implemented as per this spec, drawing from similar work in the following of my projects:
- https://github.com/evanx/mpush-redis
- https://github.com/evanx/chronica
- https://github.com/evanx/redex


#### mpush

See the `Service` supervisor code: https://github.com/evanx/mpush-redis/blob/master/src/Service.js

```javascript
async initComponent(component, name) {
   assert(name, 'component name');
   logger.info('initComponent', name);
   await component.init({
      name: name,
      logger: this.createLogger(name),
      config: this.config,
      components: this.components,
      context: this
   });
   this.initedComponents.push(component);
   this.components[name] = component;
}
```

#### Redex

See code: https://github.com/evanx/redex/blob/master/lib/Redex.js

Incidently, Redex calls its components "processors," because they handle messages.

```javascript
async endProcessors() {
   for (let processorName of [...this.initedProcessorKeys]) {
      let processor = this.processorMap.get(processorName);
      if (lodash.isFunction(processor.end)) {
         logger.info('end', processorName);
         try {
            await processor.end();
         } catch (err) {
            logger.error(err, 'end', processorName);
         }
      } else {
         logger.warn('end', processorName);
      }
   }
}
```

#### Chronica

See its `ComponentFactory` documentation: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md

```javascript
async function initComponents() {
   logger.debug('initComponents', state.componentNames);
   for (let name of state.componentNames) {
      assert(!state.components[name], 'unique component: ' + name);
      let config = rootConfig[name] || {};
      config.class = config.class || name;
      let componentClassFile = getClassFile('components', config.class);
      config = YamlDecorator.decorateClass(componentClassFile, config);
      if (config.requiredComponents) {
         config.requiredComponents.forEach(required =>
               state.requiredComponents.add(required));
      } else {
         logger.warn('no requiredComponents', name);
      }
      state.configs.set(name, config);
      let component = createComponent(name, config, componentClassFile);
      state.components[name] = component;
   }
}
```

### Further reading

Component validator implementation: https://github.com/evanx/component-validator/blob/master/componentValidator.md

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md
