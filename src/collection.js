import assert from 'assert';
import Query from './query';
import {throwIfNotArray} from './util';

const InternalReadSymbol = Symbol('[[read]]');

export default class Collection {
  constructor({name, read, timeout = 1500} = {}) {
    SetInternalRead(this, read);
  }
  
  [InternalReadSymbol]() {
    throw new ReferenceError('Collection is not linked to a database');
  }
  
  read() {
    /**
     * Ensure that the returned value of this[[read]] is a Promise
     * that rejects if the result is not an Array.
     */
    return CallInternalRead(this).then(throwIfNotArray);
  }
  
  find(filter, {limit, sort} = {}) {
    // TODO: implement filter, limit, sort
    
    let query = new Query(this.read());
    
    if (typeof filter !== undefined && filter !== null) {
      query = query.filter(filter);
    }
     
    if (sort) {
      query = query.sort(sort);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  findOne(filter, {sort} = {}) {
    const _findOne = this.find(filter, {sort}).limit(1).then((results) => {
      // If empty array, return `undefined`, otherwise the first item in the array.
      return (results.length > 0 ? results[0] : undefined);
    });

    return new Query(_findOne);
  }
}

function SetInternalRead(collection, fn) {
  if (typeof fn === 'function') {
    collection[InternalReadSymbol] = fn;
  } else if (typeof fn !== 'undefined') {
    throw new TypeError('Function expected in assigning to Collection[[read]] member');
  }
}

async function CallInternalRead(collection) {
  const fn = collection[InternalReadSymbol];
  
  assert.equal(typeof fn, 'function', 'Invalid overwritten Collection[[read]] method');
  
  return fn.call(collection);
}
