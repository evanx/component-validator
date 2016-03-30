
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

console.info('start', process.env.componentModule);

var componentModule = process.env.componentModule;
var componentName = process.env.componentModule.match(/([^\/]+)$/)[1];

require("babel-polyfill");
require('babel-core/register');

var componentClass = require(process.env.componentModule);

console.info('componentClass', componentClass);
