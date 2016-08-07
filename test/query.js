import Query from '../src/query';
import {test} from './lib/tape';
import testProto from './util/test_proto';

function isQuery(o) {
  if (!(o instanceof Query)) {
    throw new TypeError('Not a Query instance');
  }
}

const proto = Query.prototype;
const methods = ['catch', 'constructor', 'filter', 'limit', 'sort', 'then'];

const result1 = [];
const result2 = [1, 2, 3];
const result3 = [{value: 1, type: 'obj'}, {value: 2, type: 'obj'}, {value: 3, type: 'obj'}];
const result4 = new TypeError('Failed #1');
const result5 = result3.concat([undefined, {value: 4, type: 'other'}, null, undefined]);

const p1 = Promise.resolve(result1);
const p2 = Promise.resolve(result2);
const p3 = Promise.resolve(result3);
const p4 = Promise.reject(result4);
const p5 = Promise.resolve(result5);


test('Query prototype', function(assert) {
  return testProto(assert, Query.prototype, methods);
});

test('Creating Query instances', function(assert) {
  const ctor = proto.constructor;
  const resolvedPromise1 = Promise.resolve([]);
  
  assert.plan(9);
  
  assert.equal(ctor.length, 1, '[constructor] expects 1 argument');
  
  assert.doesNotThrow(() => {
    new Query(resolvedPromise1);
  }, 'works with Promise parameter');
  
  assert.throws(() => {
    new Query();
  }, SyntaxError, 'fails without a Promise parameter');
  
  ((q) => {
    const hasOwnPropertyName = (name) => (Object.getOwnPropertyNames(q).indexOf(name) !== -1);
    
    assert.equal(typeof q.then, 'function', 'Query instance must have a then method');
    assert.rejects(proto.then(), ReferenceError, 'Prevents calling Query.prototype.then');
    assert.resolves(proto.catch((e) => (e instanceof ReferenceError)), true, 'prototype `catch` method can be used');
    assert.equal(hasOwnPropertyName('then'), true, 'then method is own property');
    assert.notEqual(q['then'], proto.then, 'then method is not the one defined in the prototype');
    
    (async function(p) {
      var qthen = await q.then();
      var pthen = await p.then();
      assert.equal(qthen, pthen, 'query.then() solves to the same value as original promise.then()');
    })(resolvedPromise1);
  
  })(new Query(resolvedPromise1));
});

test('filter(): empty arguments', function(assert) {
  const query = new Query(p1);
  
  assert.plan(9);
  
  assert.doesNotThrow(() => query.filter(), 'filter without arguments does not throw');
  assert.equals(query.filter(), query, 'filter without arguments returns the same Query instance');
  assert.resolves(query.filter(), 'filter without arguments resolves');
  assert.doesNotThrow(() => query.filter(undefined), 'filter with argument `undefined` does not throw');
  assert.equals(query.filter(undefined), query, 'filter with argument `undefined` returns the same Query instance');
  assert.resolves(query.filter(undefined), 'filter with argument `undefined` resolves');
  assert.doesNotThrow(() => query.filter({}), 'filter with empty object `{}` argument does not throw');
  assert.equals(query.filter({}), query, 'filter with empty object `{}` argument returns same instance');
  assert.resolves(query.filter({}), 'filter with empty object `{}` argument resolves');
});

test('filter(): non-object arguments', function(assert) {
  const query = new Query(p1);
  
  assert.plan(9);
  
  assert.doesNotThrow(() => query.filter(null), 'filter(null) does not throw');
  assert.doesNotThrow(() => isQuery(query.filter(null)), 'filter(null) returns a Query instance');
  assert.rejects(query.filter(null), TypeError, 'filter(null) rejects with a TypeError');
  assert.doesNotThrow(() => query.filter(2), 'filter(2) does not throw');
  assert.doesNotThrow(() => isQuery(query.filter(2)), 'filter(2) returns a Query instance');
  assert.rejects(query.filter(2), TypeError, 'filter(2) rejects with a TypeError');
  assert.doesNotThrow(() => query.filter(false), 'filter(false) does not throw');
  assert.doesNotThrow(() => isQuery(query.filter(false)), 'filter(false) returns a Query instance');
  assert.rejects(query.filter(false), TypeError, 'filter(false) rejects with a TypeError');
});

test('filter(): empty collection', function(assert) {
  const query = new Query(p1);
  
  assert.plan(4);
  
  query.filter().then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called without arguments');
    assert.equals(arr.length, 0, 'array is empty, when called without arguments');
  });
  
  query.filter({something: 'else'}).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called with arguments');
    assert.equals(arr.length, 0, 'array is empty, when called with arguments');
  });
});

test('filter(): non-document collection', function(assert) {
  const query = new Query(p2);
  
  assert.plan(4);
  
  query.filter().then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called without arguments');
    assert.equals(arr.length, result2.length, 'array is not empty, when called without arguments');
  });
  
  query.filter({something: 'else'}).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called with arguments');
    assert.equals(arr.length, 0, 'array is empty, when called with arguments');
  });
});

test('filter(): document collection', function(assert) {
  const query = new Query(p3);
  const validArray = result3;
  
  assert.plan(6);
  
  query.filter().then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called without arguments');
    assert.equals(arr.length, validArray.length, 'array has correct length, when called without arguments');
  });
  
  query.filter(validArray[2]).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called with item object in array');
    assert.equals(arr.length, 1, 'array contains one item, when called with item object in array');
    assert.equals(arr[0], validArray[2], 'contains the correct match');
  });
  
  query.filter({type: 'obj'}).then((arr) => {
    assert.equals(arr.length, validArray.length, 'array has correct length, when called with `{type: \'obj\'}`');
  });
});

test('filter(): mixed collection containing documents, undefined and null', function(assert) {
  const query = new Query(p5);
  const originalArray = result5;
  const validArray = result5.filter((v) => (typeof v === 'object' && v !== null));
  
  assert.plan(6);
  
  query.filter().then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called without arguments');
    assert.equals(arr.length, originalArray.length, 'array has original array length, when called without arguments');
  });
  
  query.filter(validArray[2]).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'resolves with an array, when called with item object in array');
    assert.equals(arr.length, 1, 'array has one item, when called with item object in array');
    assert.equals(arr[0], validArray[2], 'contains the correct match');
  });
  
  const objArray = validArray.filter((d) => (d['type'] === 'obj'));
  query.filter({type: 'obj'}).then((arr) => {
    assert.equals(arr.length, objArray.length, 'array has correct length, when called with `{type: \'obj\'}`');
  });
});

test('filter(): function argument', function(assert) {
  const query = new Query(p5);
  const originalArray = result5;
  
  // A function that creates a filter function that counts the number of times it's been called.
  const createFilterFn = () => {
    let nCalls = 0;
    const fn = (doc) => {
      fn.called = ++nCalls;
      return true;
    };
    fn.called = nCalls;
    return fn;
  };
  
  assert.plan(8);
  
  const fn1 = createFilterFn();
  assert.doesNotThrow(() => query.filter(fn1), 'does not throw when passing a function parameter');
  assert.doesNotThrow(() => isQuery(query.filter(fn1)), 'returns a Query instance');
  assert.resolves(query.filter(fn1), 'resolves for a function that does not throw');
  
  const fn2 = (doc) => { throw new TypeError('Just throw'); };
  assert.rejects(query.filter(fn2), TypeError, 'rejects for a function that throws');
  
  const fn3 = createFilterFn();
  query.filter(fn3).then((arr) => {
    assert.equals(arr.length, originalArray.length, 'resolves to the correct number of items');
    assert.equals(fn3.called, originalArray.length, 'function parameter called for each item in the collection');
  });
  
  const queryEmpty = new Query(Promise.resolve([]));
  const fn4 = createFilterFn();
  queryEmpty.filter(fn4).then((arr) => {
    assert.equals(arr.length, 0, 'resolves to empty results array for empty given array');
    assert.equals(fn4.called, 0, 'function parameter not called for empty array.');
  });
});

test('limit(): ', function(assert) {
  const query = new Query(p5);
  const originalArray = result5;
  const originalLength = originalArray.length;

  assert.plan(27);
  
  assert.doesNotThrow(() => query.limit(), 'without arguments: does not throw when called');
  assert.equals(query.limit(), query, 'without arguments: returns the same Query instance');
  assert.doesNotThrow(() => query.limit(undefined), 'undefined argument: does not throw when called');
  assert.equals(query.limit(undefined), query, 'undefined argument: returns the same Query instance');
  assert.doesNotThrow(() => query.limit(Infinity), 'Infinity argument: does not throw');
  assert.equals(query.limit(Infinity), query, 'Infinity argument: returns the same Query instance');
  assert.doesNotThrow(() => query.limit(0), 'Number 0: does not throw');
  assert.doesNotThrow(() => isQuery(query.limit(0)), 'Number 0: returns a Query instance');
  query.limit(0).then((arr) => assert.equals(Array.isArray(arr), true, 'Number 0: returns an Array'));
  query.limit(0).then((arr) => assert.equals(arr.length, 0, 'Number 0: returned Array is empty'));
  assert.doesNotThrow(() => query.limit(1), 'Number > 0: does not throw');
  assert.doesNotThrow(() => isQuery(query.limit(1)), 'Number > 0: returns a Query instance');
  assert.throws(() => query.limit(null), 'invalid argument null: throws');
  assert.throws(() => query.limit({}), 'invalid argument {}: throws');
  assert.throws(() => query.limit(false), 'invalid argument boolean: throws');
  assert.throws(() => query.limit(''), 'invalid argument string: throws');
  assert.throws(() => query.limit(-1), 'negative number: throws');
  assert.throws(() => query.limit(-Infinity), 'negative Infinity: throws');
  assert.throws(() => query.limit(NaN), 'NaN: throws');
  
  const validLimit = 3;
  assert.doesNotThrow(() => query.limit(validLimit), 'Valid limit: does not throw');
  assert.resolves(query.limit(validLimit), 'Valid limit: resolves');
  query.limit(validLimit).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'Valid limit: returns an array');
  });
  query.limit(validLimit).then((arr) => {
    assert.equals(arr.length, validLimit, 'Valid limit: returns a correctly limited array');
  });
  
  const largerLimit = originalLength + 1;
  assert.doesNotThrow(() => query.limit(largerLimit), 'Larger limit: does not throw');
  assert.resolves(query.limit(largerLimit), 'Larger limit: resolves');
  query.limit(largerLimit).then((arr) => {
    assert.equals(Array.isArray(arr), true, 'Larger limit: returns an array');
  });
  query.limit(largerLimit).then((arr) => {
    assert.equals(arr.length, originalLength, 'Larger limit: returns a correctly limited array');
  });
});

test('sort(): TODO', function(assert) {
  const query = new Query(p5);
  
  assert.plan(3);
  
  assert.doesNotThrow(() => query.sort(), 'does not throw when called without a parameter');
  assert.equals(query.sort(), query, 'returns the same Query instance');
  assert.doesNotThrow(() => isQuery(query.sort()), 'returns a Query instance');
});
