
## component-validator

Validate that an `npm` module is a lightweight ES6 "component" of a certain specification, as presented here.

### Goal

To formalise a basic component model for various projects, for lifecycle management.


### Specification

A component:
- is assigned a unique instance name
- is provided with a set of immutable `props` aka a static configuration
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

Note that the dependencies passed via `service` are intentionally, are intentially loosely defined as follows:
- any dependent components therein must be initialised before `start` is invoked

The component factory implementation

### ES2016

Expressed as an ES6 `class` with ES2916 `async` functions:
```javascript
export default HelloComponent {
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
where `logger` et al are provided via the `state` object, which we lazily `Object.assign` into `this.`

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


#### `async start()`

- invoked after this component and its dependencies have been initialised successfully
- not invoked after `end` (needless to say)


#### `async end()`

- shutdown the component

Note that the component should not `end()` itself. Rather it should signal an error via `service.error(this, err).`

The component manager is responsible for ending all components in the event of an error.


### Status

WORK IN PROGRESS

### Implementation

TODO

### Installation

```shell
git clone https://github.com/evanx/component-validator
cd component-validator
npm install
```
TODO We validate a component on Github as follows:
```shell
npm install http://github.com/evanx/sample-component
npm validate sample-component
```

### Further reading

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md


#### Chronica

My "monitoring" project has similar component model: https://github.com/evanx/chronica

Especially see its `ComponentFactory` documentation: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


#### Redex

My "Redex" framework for Redis-based messaging as a similar component model: https://github.com/evanx/redex
