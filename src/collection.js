import Query from './query';

const symRead = Symbol('read');

export default class Collection {
  constructor({name, read, timeout = 1500} = {}) {
    if (typeof read === 'function') {
      this[symRead] = read;
    }
  }
  
  async [symRead]() {
    throw new TypeError('Collection is not linked to a database');
  }
  
  read() {
    return readToPromise(this[symRead]());
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
    return this.find(filter, {sort}).limit(1).then((results) => {
      return (results.length > 0 ? results[0] : null);
    });
  }
}

function throwIfNotArray(arr) {
  if (false === Array.isArray(arr)) {
    throw new TypeError('Invalid collection data');
  }
  
  return arr;
}

function readToPromise(result) {
  if (typeof result !== 'object' || result === null || typeof result['then'] !== 'function') {
    result = Promise.resolve(result);
  }
  
  return result.then(throwIfNotArray);
}
