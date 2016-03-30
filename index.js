
var assert = require('assert');
var bunyan = require('bunyan');
var lodash = require('lodash');
var os = require('os');

var ValidationError = function() {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  var args = [].slice.call(arguments);
  this.message = JSON.stringify(args);
}

var logger = global.bunyan.createLogger({name: 'entry', level: 'debug'});

logger.info('start', process.argv);

