'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _bluebird = require('bluebird');

exports.default = function () {
   var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee3(state, props, logger, metrics, service) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
         while (1) {
            switch (_context3.prev = _context3.next) {
               case 0:
                  logger.info('hello', props);
                  return _context3.abrupt('return', {
                     start: function () {
                        var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee() {
                           return regeneratorRuntime.wrap(function _callee$(_context) {
                              while (1) {
                                 switch (_context.prev = _context.next) {
                                    case 0:
                                       logger.info('state ready');

                                    case 1:
                                    case 'end':
                                       return _context.stop();
                                 }
                              }
                           }, _callee, this);
                        }));

                        function start() {
                           return ref.apply(this, arguments);
                        }

                        return start;
                     }(),
                     end: function () {
                        var ref = (0, _bluebird.coroutine)(regeneratorRuntime.mark(function _callee2() {
                           return regeneratorRuntime.wrap(function _callee2$(_context2) {
                              while (1) {
                                 switch (_context2.prev = _context2.next) {
                                    case 0:
                                       logger.info('goodbye');

                                    case 1:
                                    case 'end':
                                       return _context2.stop();
                                 }
                              }
                           }, _callee2, this);
                        }));

                        function end() {
                           return ref.apply(this, arguments);
                        }

                        return end;
                     }()
                  });

               case 2:
               case 'end':
                  return _context3.stop();
            }
         }
      }, _callee3, this);
   }));
   return function (_x, _x2, _x3, _x4, _x5) {
      return ref.apply(this, arguments);
   };
}();
