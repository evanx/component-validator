
## component-validator

Validate that an `npm` module is a lightweight ES2016 "component" according to the lifecycle specification proposed here.

### implementation

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
validateComponent hello-component-class [ 'name', 'props', 'logger', 'metrics', 'context' ]
system ready hello-component-class
goodbye
OK hello-component-class
OK module loaded
```

#### Demo script

See `scripts/hello/sh:`
```shell
c2validateComponent() {
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
c2validateComponent hello-component-class https://github.com/evanx/hello-component-class
c2validateComponent hello-component https://github.com/evanx/hello-component
```

### Further reading

Related projects and further plans: https://github.com/evanx/mpush-redis/blob/master/related.md
