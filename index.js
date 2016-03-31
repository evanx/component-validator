
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

require('babel-polyfill');
require('babel-core/register')({ignore: false});

const Component = require('./Component').default;

Component.loadModule(process.env.componentModule);
