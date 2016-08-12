import {test} from './lib/tape';
import testProto from './util/test_proto';
import {AssertionError} from 'assert';
import {Collection, proto, methods, symbols} from './lib/collection';
import {isQuery} from './lib/query';
import {throwIfNotArray} from '../src/util';

const ctor = Collection;

test('Collection prototype', function(assert) {
  return testProto(assert, Collection.prototype, methods);
});

test('Collection prototype #2:', function(assert) {
  assert.plan(2);
  assert.equal(symbols.length, 1, 'only has default [[read]] internal member on prototype');
  assert.equal(typeof proto[symbols[0]], 'function', 'default [[read]] internal method is a function');
});

test('Creating Collection instances', function(assert) {
  const _ctor = proto.constructor;
  
  assert.plan(13);
  
  assert.equal(_ctor.length, 0, '[constructor] expects no arguments');
  assert.doesNotThrow(() => { new ctor(); }, 'works without arguments');
  assert.doesNotThrow(() => { new ctor({}); }, 'works with an object argument, but no `read` defined');
  assert.doesNotThrow(() => { new ctor(undefined); }, 'works with argument `undefined`');
  assert.throws(() => { new ctor(null); }, 'does not allow `null` argument');
  assert.doesNotThrow(() => { new ctor('smth'); }, 'allows string argument');
  assert.doesNotThrow(() => { new ctor(1); }, 'allows number argument');
  assert.throws(() => { new ctor({read: null}); }, 'does not allow non-function `read` parameter: null');
  assert.throws(() => { new ctor({read: false}); }, 'does not allow non-function `read` parameter: false');
  assert.throws(() => { new ctor({read: true}); }, 'does not allow non-function `read` parameter: true');
  assert.throws(() => { new ctor({read: 'smth'}); }, 'does not allow non-function `read` parameter: string');
  assert.throws(() => { new ctor({read: 0}); }, 'does not allow non-function `read` parameter: number');
  assert.doesNotThrow(() => { new ctor({read: () => {}}); }, 'works with a `read` function parameter');
});

test('Collection [[read]] method:', function(assert) {
  const col = new Collection();
  const col2 = new Collection({read: () => { return null; }});
  const col3 = new Collection({read: () => { return []; }});
  const col4 = new Collection({read: () => { throw new URIError('throwing'); }});
  
  const col5 = new Collection();
  col5[symbols[0]] = false;
  
  assert.plan(9);
  
  assert.doesNotThrow(() => col.read(), 'Default: Calling internal method [[read]] does not throw');
  assert.doesNotThrow(() => col2.read(), 'Assigned: Calling internal method [[read]] does not throw');
  assert.rejects(col.read(), ReferenceError, 'Collection default [[read]] internal method on prototype rejects');
  assert.rejects(col2.read(), TypeError, 'Collection assigned non-array returning [[read]] rejects');
  assert.resolves(col3.read(), 'Collection assigned [[read]] internal method resolves');
  assert.doesNotThrow(() => col4.read(), 'Throwing errors in [[read]] internal method are enclosed');
  assert.rejects(col4.read(), URIError, 'Throwing errors in [[read]] internal method propagate to rejection');
  assert.doesNotThrow(() => col5.read(), 'Hacking invalid internal method [[read]] does not throw');
  assert.rejects(col5.read(), AssertionError, 'Hacking invalid internal method [[read]] rejects');
});

test('Collection.prototype.find', function(assert) {
  const col = new Collection();
  const originalArray = [1, 2, 3, 4, 5];
  const col2 = new Collection({read: () => originalArray});
  
  assert.plan(10);
  
  assert.doesNotThrow(() => col.find(), 'find(): callable on non-linked collection');
  assert.doesNotThrow(() => isQuery(col.find()), 'find(): returns a Query on non-linked collection');
  assert.doesNotThrow(() => col2.find(), 'find(): callable on linked collection');
  assert.doesNotThrow(() => isQuery(col2.find()), 'find(): returns a Query on linked collection');
  assert.doesNotThrow(() => col.find(null), 'find(null): allows null filter');
  assert.doesNotThrow(() => isQuery(col.find(null)), 'find(null): returns a Query instance');
  assert.doesNotThrow(() => col.find({}), 'find({}): allows non-null filter');
  assert.doesNotThrow(() => isQuery(col.find({})), 'find({}): returns a Query instance');
  assert.doesNotThrow(() => col.find({}, {sort: () => {}, limit: 3}), 'allows sort and limit options');
  (function testLimit(collection) {
    const f = collection.find({}, {limit: 3});
    f.then((arr) => assert.equals(arr.length, 3, 'limit works with find()'));
  })(col2);
});

test('Collection.prototype.findOne', function(assert) {
  const originalArray = [{id: 3}, {id: 1}, {id: 2}];
  const col = new Collection({read: () => originalArray});
  
  assert.plan(6);
  
  assert.doesNotThrow(() => col.findOne(), 'findOne(): allows for no arguments');
  assert.doesNotThrow(() => isQuery(col.findOne()), 'findOne(): returns a Query instance');
  
  const col2 = new Collection({read: () => originalArray});
  col2.find = (...args) => { throw new SyntaxError('find() called'); };
  assert.throws(() => col2.findOne(), SyntaxError, 'findOne(): calls find()');
  
  assert.rejects(col.findOne().then(throwIfNotArray), 'findOne(): does not return an array');
  assert.resolves(col.findOne({id: 1}), {id: 1}, 'findOne(): correctly returns the searched item');
  assert.resolves(col.findOne({id: 4}), undefined, 'findOne(): returns undefined when no matches');
});
