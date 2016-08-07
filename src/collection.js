import Query from './query';

export default class Collection {
  constructor(name, {database = null, timeout = 1500} = {}) {
    this._name = name;
    this._database = database;
    this._timeout = timeout;
  }
  
  _read() {
    return Promise.reject(new TypeError('Collection is not linked to a database'));
  }
  
  read() {
    return (Array.isArray(this.docs) ? Promise.resolve(this.docs) : this._read().then((d) => this.docs = d));
  }
  
  find(filter, {limit, sort} = {}) {
    // TODO: implement filter, limit, sort
    let query = new Query(this.read());
    
    if (typeof filter !== undefined && filter !== null) {
      query = query.filter(filter);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (sort) {
      query = query.sort(sort);
    }
    
    
    return query;
  }
  
  findOne(filter, {sort} = {}) {
    return this.find(filter, {sort}).limit(1).then((results) => {
      return (results.length > 0 ? results[0] : []);
    });
  }
}
