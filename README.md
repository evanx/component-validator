
## component-validator

Validate that an `npm` module is a lightweight ES6 "component" of a certain specification, as presented here.

### Goal

To formalise a basic component model across some of my Node projects, for configuration and lifecycle management.


### Specification

A component:
- is assigned a unique instance name
- is provided with a set of immutable `props` aka a static configuration
- its props should be defaulted and validated by the component factory
- is provided with a logger, for convenience
- is provided with other dependencies via a `service` object
- is initialised with a `state` object which includes `{name, props, logger, service}`
- should have specified lifecycle hooks as detailed below
- all of these lifecycle hooks must return an ES6 `Promise`

Intentionally, the lifecycle hooks can be expressed as ES2016 `async` functions for `await`

Lifecycle hooks:
- initialise the component
- `start` function
- `end` function

When expressed an as ES6 `class:`
- must have an `async init(state)` function

The dependencies passed via `service` are constrained only as follows:
- any components therein must be initialised before `start` is invoked


#### Component factory

The component factory implementation is yet to be extracted from various projects into an independent module:
- https://github.com/evanx/mpush-redis
- https://github.com/evanx/chronica
- https://github.com/evanx/redex

The implementation does not exclude the possibly of the application context singleton being passed as the `service` to all components. In this case, the application is relatively unprotected against misbehaving components. The component manager should rather isolate the components, to minimise globally mutable state.

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
- validate the `service` requirements before calling `init`
- initialise any required `service` components before calling `start()`


### ES2016

Expressed as an ES6 `class` with ES'16 `async` functions:
```javascript
export default class HelloComponent {
   async init(state) {
      Object.assign(this, state);
      this.logger.info('hello', this.props);
   }
   async start() {
      this.logger.info('state ready');
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
         logger.info('state ready');
      },
      async end() {
         logger.info('goodbye';      
      }
   };
}
```
where for convenience `props` and `logger` are passed as superflous arguments.

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
- are not necessarily idempotent, insomuch as they are called at most once.


#### `init`

This is invoked to initialise the component with a `state` object containing:
- `name` - the component's unique instance name
- `logger` - a logger configured with the component's name
- `props` - the immutable configuration of the component
- `service` - for dependencies e.g. other required components


#### `start`

- invoked after this component and its dependencies have been initialised successfully
- not invoked after `end` (needless to say)


#### `end`

- shutdown the component

Note that the component should not `end()` itself. Rather it should signal an error via `service.error(this, err).`

The component manager is responsible for ending all components in the event of an error.


### Status

WORK IN PROGRESS

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
   console.info('ok', component.name);
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
componentModule function true []
hello { timeout: 60 }
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
validate hello-component-class
componentModule function true []
hello hello-component-class
validateComponent hello-component-class [ 'name', 'props', 'logger' ]
ok hello-component-class
```

### Further reading

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md


#### Chronica

My "monitoring" project has similar component model: https://github.com/evanx/chronica

Especially see its `ComponentFactory` documentation: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


#### Redex

My "Redex" framework for Redis-based messaging as a similar component model: https://github.com/evanx/redex
