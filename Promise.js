'use strict';
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Promise = root.Promise || factory();
  }
}(typeof window !== 'undefined' ? window : global, function () {
  var root = typeof window !== 'undefined' ? window : global;
  var nextTick = (function () {
    var callbacks = [];
    var pending = false;

    if (typeof MutationObserver !== 'undefined') {
      var counter = 1;
      var observer = new MutationObserver(function () {
        pending = false
        var copies = callbacks.slice(0)
        var scallbacks = []
        for (var i = 0; i < copies.length; i++) {
          copies[i]()
        }
      });
      var textNode = document.createTextNode(counter);
      observer.observe(textNode, {
        characterData: true
      })
      return function (fn) {
        callbacks.push(fn)
        if (!pending) {
          pending = true
          counter = (counter + 1) % 2
          textNode.data = counter
        }
      }
    } else {
      return root.nextTick || root.setImmediate || root.setTimeout
    }
  })();

  var Promise = function (executor) {
    if (this === undefined || this === root) return new Promise(executor);
    if (this instanceof Promise) {
      if (this._stat) throw new TypeError('#<Promise> is not a promise');
    } else {
      throw new TypeError(this + ' is not a promise');
    }

    this._stat = 'pending';
    this._id = '#' + uid();
    var res = resolve.bind(this);
    var rej = reject.bind(this);
    invoke(executor.bind(null, res, rej), rej)
    return this;
  };
  // private method
  var n = 0;

  function uid() {
    return n++ % 65535;
  }

  function resolve(value) {
    this._stat = 'resolved';
    this._value = value;
    if (this._onResolve) onStateChangeAync.call(this);
  }

  function reject(error) {
    this._stat = 'rejected';
    this._error = error;
    if (this._onReject) onStateChangeAync.call(this);
  }

  function invoke(exec) {
    var args = Array.prototype.slice.call(arguments, 1);
    var handle = args.splice(args.length - 1, 1)[0];
    try {
      exec.apply(null, args);
    } catch (e) {
      handle(e);
    }
  }

  function onStateChange() {
    var queue, ret, callback;
    if (this._stat === 'resolved') {
      queue = this._onResolve;
      ret = this._value;
    } else if (this._stat === 'rejected') {
      queue = this._onReject;
      ret = this._error;
    }
    while (callback = queue.shift()) {
      invoke(callback.fn, ret, callback.exceptionHandle);
    }
  }

  function onStateChangeAync() {
    this._onStateChanging = true;
    nextTick(function () {
      onStateChange.call(this);
      this._onStateChanging = false;
    }.bind(this))
  }

  function assertPromiseConstructor(obj) {
    if (obj !== Promise) throw new TypeError(obj + ' is not a promise constructor');
  }

  function assertPromise(obj) {
    if (obj.constructor !== Promise) throw new TypeError(obj + ' is not a promise')
  }

  function assertIterable(obj) {
    if (typeof obj !== 'object' || obj === null || typeof obj.length !== 'number') {
      throw new TypeError(obj + ' is non-iterable');
    }
  }

  function identity(value) {
    return value
  };

  Promise.prototype.then = function (onResolve, onReject) {
    assertPromise(this);
    return new Promise(function (resolve, reject) {
      if (!onResolve) onResolve = identity;
      this._onResolve || (this._onResolve = []);
      this._onReject || (this._onReject = []);
      var oldOnReject = onReject;

      this._onResolve.push({
        fn: function (value) {
          retHandle(onResolve(value))
        },
        exceptionHandle: reject
      })
      if (onReject) {
        onReject = function (error) {
          retHandle(oldOnReject(error));
        }
      } else {
        onReject = function (error) {
          reject(error);
        }
      }
      this._onReject.push({
        fn: onReject,
        exceptionHandle: reject
      })

      if (this._stat === 'resolved' || this._stat === 'rejected') {
        onStateChangeAync.call(this);
      }

      function retHandle(ret) {
        if (typeof ret === 'object' && typeof ret.then === 'function') {
          ret.then(resolve, reject);
        } else {
          nextTick(function () {
            resolve(ret);
          })
        }
      }
    }.bind(this))
  }

  Promise.prototype.catch = function (onReject) {
    return this.then(identity, onReject);
  }

  Promise.all = function (promises) {
    assertPromiseConstructor(this);
    var constructor = this;
    var remain = promises.length;
    var retCache = [];
    var flag = true;
    var onResolve = function (resolve, index, value) {
      retCache[index] = value;
      if (--remain === 0) {
        resolve(retCache);
      }
    }
    var onReject = function (reject, index, error) {
      return flag && ((flag = false) || reject(error));
    }
    return new constructor(function (resolve, reject) {
      try {
        assertIterable(promises)
      } catch (e) {
        return reject(e);
      }
      if (!promises.length) return resolve([]);
      for (var i = 0; i < promises.length; i++) {
        promises[i].then(onResolve.bind(null, resolve, i), onReject.bind(null, reject, i));
      }
    }.bind(this))
  }

  Promise.race = function (promises) {
    assertPromiseConstructor(this);
    var constructor = this;
    var flag = true;
    var onRet = function (fn, i, ret) {
      return flag && ((flag = false) || fn(ret));
    }
    return new constructor(function (resolve, reject) {
      try {
        assertIterable(promises)
      } catch (e) {
        return reject(e);
      }
      var onResolve = onRet.bind(null, resolve, i);
      var onReject = onRet.bind(null, reject, i);
      for (var i = 0; i < promises.length; i++) {
        var promise = promises[i];
        promise.then(onResolve, onReject)
        if (promise._stat === 'resolved' || promise._stat === 'rejected') return;
      }
    }.bind(this))
  }

  Promise.resolve = function (value) {
    assertPromiseConstructor(this);
    var constructor = this;
    if (value instanceof constructor) return value;
    return new constructor(function (resolve) {
      resolve(value);
    })
  }

  Promise.reject = function (error) {
    assertPromiseConstructor(this);
    var constructor = this;
    return new constructor(function (resolve, reject) {
      reject(error);
    })
  }
  return Promise;
}));