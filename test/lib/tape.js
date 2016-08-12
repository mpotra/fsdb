import test from 'tape';
import test_promise from 'tape-promise';

test.Test.prototype.resolves = function(promise, ...args) {
  const self = this;
  const msg = (args.length && typeof args[args.length - 1] === 'string' ? args[args.length - 1] : 'promise resolves');
  
  if (!isPromise(promise)) {
    self.fail('Promise argument expected: ' + msg);
    return Promise.reject();
  }
  
  return Promise.resolve().then(() => {
    promise.then(function(val) {
      if (args.length >= 2) {
        self.looseEqual(val, ...args);
      } else {
        self.pass(...args);
      }
    }, function(err) {
      self.doesNotThrow(() => { throw err; }, msg);
    });
  });
};

test.Test.prototype.resolvesWith = function(promise, ...args) {
  const self = this;
  const msg = (args.length && typeof args[args.length - 1] === 'string' ? args[args.length - 1] : 'promise resolves');
  
  if (!isPromise(promise)) {
    self.fail('Promise argument expected: ' + msg);
    return Promise.reject();
  }
  
  return Promise.resolve().then(() => {
    promise.then(function(val) {
      self.equal(val, ...args);
    }, function(err) {
      self.doesNotThrow(() => { throw err; }, msg);
    });
  });
};

test.Test.prototype.rejects = function(promise, ...args) {
  const self = this;
  const msg = (args.length && typeof args[args.length - 1] === 'string' ? args[args.length - 1] : 'promise rejects');

  if (!isPromise(promise)) {
    self.fail('Promise argument expected: ' + msg);
    return Promise.reject();
  }
  
  return Promise.resolve().then(() => {
    promise.then(function(val) {
      self.fail(msg);
    }, function(err) {
      self.throws(() => { throw err; }, ...args);
    });
  });
};

function isPromise(p) {
  return ((typeof p === 'object' || typeof p === 'function') &&
            typeof p.then === 'function');
}

export {test, test_promise};

export function subtest(assert) {
  const _test = assert.test;
  _test.parentName = assert.name + ' -> ';
  return _test;
}
