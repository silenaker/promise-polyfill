var Promise = require('./Promise.js');
var assert = require('assert');
module.exports = {
  resolved: function (value) {
    return Promise.resolve(value);
  },
  rejected: function (reason) {
    return Promise.reject(reason);
  },
  deferred: function () {
    var resolve, reject;
    var promise = new Promise(function (res, rej) {
      resolve = res;
      reject = rej;
    })
    return {
      promise: promise,
      resolve: resolve,
      reject: reject
    }
  },
  defineGlobalPromise: function (globalScope) {
    globalScope.Promise = Promise;
    globalScope.assert = assert;
  },
  removeGlobalPromise: function (globalScope) {
    delete globalScope.Promise;
  }
}