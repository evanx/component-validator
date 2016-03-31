
## component-validator

Validate that an `npm` module is a lightweight ES2016 "component" according to the lifecycle specification proposed further below.

### Goal

I wish to formalise a basic component model for some of my Node projects, where I find myself re-implementing the same framework, which I wish to abstract here, and implement as a re-usable module. It handles configuration and lifecycle management sufficiently for my purposes.

This component model must enable:
- graceful system exit
- 3rd-party "plugin" components e.g. from independent repos on Github et al
- minimum boilerplate code
- convenient configuration

The implementation must satisfy my requirements for "plugins" expressed in ES2016. As demonstrated here, we currently `npm install` "3rd-party" modules, and use Babel to transpile them into `build/` - as I've not yet applied Babel successfully for `node_modules/.`


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
where for convenience `props` and `logger` are passed as superfluous arguments, for easy reference in the closure.

Alternatively they can be destructured from `state` as follows:
```javascript
export async function createHelloComponent({props, logger}) {
   logger.info('hello', props);
   ...
   return component;
}
```

Incidently, an ES6 `class` implementation is expressed as an equivalent function as follows:
```javascript
export async function createClassComponent(classConstructor, state) {
   const component = new classConstructor(state);
   await component.init(state);
   return component;
}
```
where the `state` is passed to the constructor, and also to its `async init` function. The component might choose to perform some initialisation in its constructor, e.g. where `await` is not required.


##### Configuration

Modules should declare invariants e.g. `HelloComponent.invariants.yaml`
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
where this metadata is used by the component supervisor to default and validate props.

Similarly, `service` dependencies should be declared:
```yaml
service:
   metrics:
      type: component
   redisClient:
      type: object
      optional: true
```

The component supervisor must:
- validate the `service` requirements before calling `init(state)`
- initialise dependent components in `service` before calling `start()`


### Lifecycle functions

The lifecycle functions:
- must return an ES6 `Promise`
- should resolve/reject within a timeout e.g. 10 seconds
- must be called at most once
- must be called by the supervisor only
- are not necessarily idempotent, insomuch as they are called at most once


#### `init({name, logger, props, metrics, service})`

This is called to initialise the component with a `state` object containing:
- `name` - the component's unique instance name
- `logger` - a logger configured with the component's name
- `metrics` - a metrics aggregator configured with the component's name
- `props` - the immutable configuration of the component
- `service` - for dependencies e.g. other required components


#### `start()`

- called after this component and its dependencies have been initialised successfully
- perhaps needless to say, not called after `end`


#### `end()`

- "end" the component e.g. for a graceful system exit.

The component supervisor is responsible for ending all components in the event of an error.

The component should not `end()` itself or other components. Rather it should signal an error via `service.error(this, err).`



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
   if (/^hello-component/.test(component.name)) {
      await timeoutLifecyleHook(component.start());
      await timeoutLifecyleHook(component.end());
   }
   console.info('OK', component.name);
}
```

However, we do not generally validate that the lifecycle functions return a `Promise` - except on our specific test cases e.g. `hello-component` and `hello-component-class.`


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
node_modules/.bin/babel node_modules/hello-component/index.js -o build/hello-component.js
componentModule=hello-component npm start
```
where we build the component with `babel` as a workaround to some Babel issues I'm experiencing with ES2016 `node_modules.`

See: https://github.com/evanx/hello-component/blob/master/index.js

We observe the following output.
```
loadModule hello-component
hello { audience: 'world' }
validateComponent hello-component [ 'start', 'end', 'name' ]
system ready
goodbye
OK hello-component
OK module loaded
```

#### ES6 class example

We validate a component on Github as follows:
```shell
npm install https://github.com/evanx/hello-component-class
node_modules/.bin/babel node_modules/hello-component-class/index.js -o build/hello-component-class.js
componentModule=hello-component-class npm start
```

See: https://github.com/evanx/hello-component-class/blob/master/index.js

We observe the following output.
```
loadModule hello-component-class
hello hello-component-class
validateComponent hello-component-class [ 'name', 'props', 'logger', 'metrics', 'service' ]
system ready hello-component-class
goodbye
OK hello-component-class
OK module loaded
```

#### Demo script

See `scripts/hello/sh:`
```shell
c2import() {
  component=$1
  url=$2
  echo; echo $component
  npm install $url
  node_modules/.bin/babel node_modules/$component/index.js -o build/hello-component-class.js
  componentModule=$component npm start
}
```
We invoke the function for our test components as follows:
```
c2import hello-component-class https://github.com/evanx/hello-component-class
c2import hello-component https://github.com/evanx/hello-component
```

### Specification

STATUS: DESIGN STAGE

The component supervisor singleton:
- supports declarative defaults of system and component configuration properties.
- supports declarative validation of properties.
- supports system configuration "transforms" to provide constituent component configurations.
- initialises each required component as per its required configuration properties and service dependencies.
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

The lifecycle hooks must return an ES6 `Promise` so that they can be expressed as ES2016 `async` functions for `await.`

When a component is expressed as an ES6 `class,` the following three functions are required:
- `init(state)`
- `start()`
- `end()`

Alternatively when an `async function(state)` creates and initialises the component, it must return an object with `start()` and `end()` but not `init(state)`

The dependencies passed via `service` are constrained only as follows:
- any components therein must be initialised before `start()` is called


#### Component supervisor

Note that the component supervisor implementation is yet to be implemented as per this spec, drawing from similar work in the following of my projects:
- https://github.com/evanx/mpush-redis
- https://github.com/evanx/chronica
- https://github.com/evanx/redex

##### mpush

See the `Service` supervisor code: https://github.com/evanx/mpush-redis/blob/master/src/Service.js

##### Redex

See code: https://github.com/evanx/redex/blob/master/lib/Redex.js

Incidently, Redex calls its components "processors," because they handle messages.

##### Chronica

See its `ComponentFactory` documentation: https://github.com/evanx/chronica/blob/master/lib/ComponentFactory.md


### Further reading

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md
