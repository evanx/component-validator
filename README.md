
## component-validator

Validate that an `npm` module is a lightweight ES6 "component" of a certain specification, as presented here.

### Goal

I wish to formalise a basic component model for some of my Node projects. I find myself re-implementing the same framework, which I wish to abstract and re-use. It handles configuration and lifecycle management sufficiently for my purposes.

### Specification

STATUS: DESIGN STAGE

The component supervisor singleton:
- supports system configuration "transforms" to provide constituent component configurations.
- initialises each required component as per its derived configuration.
- advises components to `start` when the the system is ready i.e. all components have been initialised
- initiates a graceful shutdown of all components
- supports multiple instances of the same component
- supports scheduling component tasks at various times and/or intervals

A component
- is assigned a name e.g. for configuration and logging
- is provided with a logger
- is provided with a metrics aggregator
- is configured with a set of `props` which must be considered immutable
- is provided with other dependencies via a `service` object
- is initialised with a `state` object which includes `{name, props, logger, service, metrics}`
- has lifecycle hooks including `start` and `end`

<b>The lifecycle hooks must return an ES6 `Promise` so that they can be expressed as ES2016 `async` functions for `await`</b>

When a component is expressed as an ES6 `class,` the following three functions are required:
- `init(state)`
- `start()`
- `end()`

Alternatively when an `async function(state)` creates and initialises the component, it must return an object with `start()` and `end()` but not `init(state)`

The dependencies passed via `service` are constrained only as follows:
- any components therein must be initialised before `start()` is called


#### Component factory

Note that the component factory implementation is yet to be implemented as per this spec, drawing from the following of my projects:
- https://github.com/evanx/mpush-redis
- https://github.com/evanx/chronica
- https://github.com/evanx/redex

Incidently, Redex calls its components "processors," because they handle messages.


##### Configuration

Modules should define invariants e.g. `HelloComponent.invariants.yaml`
```yaml
props:
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
where this metadata is used by the component factory to default and/or validate props.

Similarly, `service` dependencies should be declared:
```
service:
   metrics:
      type: component
      optional: true
   redisClient:
      type: object
```

The component factory should:
- validate the `service` requirements before calling `init(state)`
- initialise required `service` components (as specified here) before calling `start()`

Usually `service` includes components by our definition here, where we typically want to initialise all required components first, and then call `start()` to advise the component that the system is ready.


### ES2016

Expressed as an ES6 `class` with ES'16 `async` functions:
```javascript
export default class HelloComponent {
   async init(state) {
      Object.assign(this, state);
      this.logger.info('hello', this.props);
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

Expressed as an `async` function:
```javascript
export async function createHelloComponent(state, props, logger) {
   logger.info('hello', props);
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
where for convenience `props` and `logger` are passed as superfluous arguments.

Incidently, an ES6 `class` implementation is expressed as an equivalent function as follows:
```javascript
export async function createClassComponent(Class, state) {
   const component = new Class(state);
   await component.init(state);
   return component;
}
```

### Lifecycle functions

The lifecycle functions:
- must return an ES6 `Promise`
- must be called by the supervisor only, at most once
- are not necessarily idempotent, insomuch as they are called at most once


#### `init`

This is called to initialise the component with a `state` object containing:
- `name` - the component's unique instance name
- `logger` - a logger configured with the component's name
- `metrics` - a metrics aggregator configured with the component's name
- `props` - the immutable configuration of the component
- `service` - for dependencies e.g. other required components


#### `start`

- called after this component and its dependencies have been initialised successfully
- perhaps needless to say, not called after `end`


#### `end`

- "end" the component, for a graceful system exit.

Note that the component should not `end()` itself. Rather it should signal an error via `service.error(this, err).`

The component manager is responsible for ending all components in the event of an error.



### Implementation

```javascript
function validateComponent(component) {
   console.info('validateComponent', component.name, Object.keys(component));
   if (!component) {
      throw 'component: empty';
   }
   if (typeof component.start !== 'function') {
      throw 'component: start';
   }
   if (typeof component.end !== 'function') {
      throw 'component: end';
   }
   console.info('OK', component.name);
}
```

However, we have not validated that the lifecycle functions return a `Promise` - as we do not wish to call here.


### Installation

```shell
git clone https://github.com/evanx/component-validator
cd component-validator
npm install
```

#### Validating a component initialising function

We validate a component on Github as follows:
```shell
npm install https://github.com/evanx/hello-component
component=hello-component npm start
```

We observe the following output.
```
validate hello-component
hello { audience: 'world' }
initPromise Promise
validateComponent hello-component [ 'start', 'end', 'name' ]
ok hello-component
```

#### ES6 class example

#### Validating a component initialising function

We validate a component on Github as follows:
```shell
npm install https://github.com/evanx/hello-component-class
component=hello-component-class npm start
```

We observe the following output.
```
loadModule hello-component
hello { audience: 'world' }
validateComponent hello-component [ 'start', 'end', 'name' ]
state ready
goodbye
OK hello-component
```

### Further reading

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md


#### Chronica

My "monitoring" project has similar component model: https://github.com/evanx/chronica

Especially see its `ComponentFactory` documentation: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


#### Redex

My "Redex" framework for Redis-based messaging as a similar component model: https://github.com/evanx/redex
