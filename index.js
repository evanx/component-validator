
var lodash = require('lodash');

var ValidationError = function() {
   this.constructor.prototype.__proto__ = Error.prototype;
   Error.captureStackTrace(this, this.constructor);
   this.name = this.constructor.name;
   var args = [].slice.call(arguments);
   this.message = JSON.stringify(args);
};

if (!process.env.componentModule) {
   throw 'environment variable: componentModule';
}

var componentModule = process.env.componentModule;

console.info('validate', componentModule);

var componentName = process.env.componentModule.match(/([^\/]+)$/)[1];

var props = {
   timeout: 60
};

var logger = {
   info: function(message) {
      if (arguments[1]) {
         console.info(message, arguments[1]);
      } else {
         console.info(message);
      }
   }
};

var service = {
   error: function(component, err) {
      console.error(err, component.name);
   }
};

var state = {
   name: componentName,
   props: props,
   logger: logger
};

function constructComponent(Class, state) {
   return new Class(state);
}

function validateComponent(component) {
   console.info('component', component.name, Object.keys(component));
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

require("babel-polyfill");
require('babel-core/register')({ignore: false});

var component;
var componentModule = require(process.env.componentModule);
if (componentModule.default) {
   componentModule = componentModule.default;
}
console.info('componentModule', typeof componentModule, Object.keys(componentModule));
if (componentModule.constructor) {
   var component = constructComponent(componentModule);
   component.init(state).then(function() {
      validateComponent(component);
   });
} else if (typeof componentModule === 'function') {
   var initPromise = componentModule(state, props, logger, service).then(function(component) {
      validateComponent(component);
   }, function(err) {
      console.error(err);
   });
   console.info('initPromise', initPromise.constructor.name);
}
