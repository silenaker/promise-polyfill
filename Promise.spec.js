var assert = require('assert');
var Promise = require('./Promise.js');

describe('Promise', function () {
  describe('#constructor', function () {
    it('should call the resolve callback when promise resolve', function (done) {
      var promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
          resolve('foo');
        }, 10);
      });
      promise.then(function (result) {
        assert.equal('foo', result);
        done();
      });
    });
    it('should call the reject callback when promise reject', function (done) {
      var promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
          reject(new Error('foo'));
        }, 10);
      });
      promise.catch(function (error) {
        assert.equal('Error: foo', error.toString());
        done();
      });
    })
  });
  describe('#then', function () {
    it('should call the resolve callback when last promise resolved', function (done) {
      var promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
          resolve('one');
        }, 10);
      });
      promise
        .then(function (value) {
          return value + ' two';
        })
        .then(function (value) {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              resolve(value + ' three')
            }, 10)
          })
        })
        .then(function (value) {
          throw new Error(value);
        })
        .then(function () {}, function (error) {
          return error.toString().slice(7) + ' four';
        })
        .then(function (value) {
          assert.equal('one two three four', value);
          done();
        })
    });
    it('should call the reject callback when occur exception', function (done) {
      var promise = Promise.resolve();
      promise
        .then(function (value) {
          throw new Error('foo');
        })
        .then(function () {}, function (error) {
          assert.equal('Error: foo', error.toString())
          done();
        })
    });
    it('should call the reject callback when the promise rejected returned by last callback', function () {
      var promise = Promise.resolve();
      promise
        .then(function (value) {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              reject('Error: foo')
            }, 10)
          })
        })
        .then(function (error) {
          assert.equal('Error: foo', error);
        })
    })
    it('should pass the result when the callback is a noop', function (done) {
      var promise = Promise.resolve('initial resolved');
      promise
        .then()
        .then(function (value) {
          assert.equal('initial resolved', value);
          throw new Error('foo');
        })
        .then()
        .then(function () {}, function (error) {
          assert.equal('Error: foo', error.toString())
          done()
        })
    })
  });

  describe('#catch', function () {
    it('should catch error when callback occur exception', function (done) {
      var promise = Promise.reject('initial reject');
      promise
        .catch(function (error) {
          assert.equal('initial reject', error);
          throw new Error('foo reject');
        })
        .catch(function (error) {
          assert.equal('Error: foo reject', error)
          done();
        })
    })
  })

  describe('#race', function () {
    var flag = '';
    it('should call the resolve callback when one of promises resolved', function (done) {
      Promise
        .race([
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('one resolve')
            }, 10)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              rej('two reject')
            }, 20)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('three resolve')
            }, 30)
          })
        ])
        .then(function (value) {
          flag = value;
        })
        .then(function () {
          setTimeout(function () {
            assert.equal('one resolve', flag);
            done();
          }, 40)
        })
    });
    it('should call the reject callback when one of promises rejected', function (done) {
      var flag = '';
      Promise
        .race([
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('one resolve')
            }, 20)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              rej('two reject')
            }, 10)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('three resolve')
            }, 30)
          })
        ])
        .then(function (value) {
          flag = value;
        })
        .catch(function (error) {
          assert.equal('two reject', error);
          setTimeout(function () {
            assert.equal('', flag);
            done();
          }, 40)
        })
    });
  })

  describe('#all', function () {
    it('should call the resolve callback when all promises resolved', function (done) {
      Promise
        .all([
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('one resolve')
            }, 10)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('two resolve')
            }, 20)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('three resolve')
            }, 30)
          })
        ])
        .then(function (values) {
          assert.equal('one resolve', values[0]);
          assert.equal('two resolve', values[1]);
          assert.equal('three resolve', values[2]);
          done();
        })
    });
    it('should call the reject callback when one of promises rejected', function (done) {
      var flag = '';
      Promise
        .all([
          new Promise(function (res, rej) {
            setTimeout(function () {
              rej('one reject')
            }, 10)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              rej('two reject')
            }, 20)
          }),
          new Promise(function (res, rej) {
            setTimeout(function () {
              res('three resolve')
            }, 30)
          })
        ])
        .catch(function (error) {
          flag = error;
        })
        .then(function () {
          setTimeout(function () {
            assert.equal('one reject', flag);
            done();
          }, 40)
        })
    });
  })
});