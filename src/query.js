
export default class Query {
  constructor(promise) {
    if (typeof promise !== 'object' || promise === null || typeof promise.then !== 'function') {
      throw new SyntaxError('Expected promise parameter');
    }
  
    this.then = (...args) => new Query(promise.then(...args));
  }
  
  /**
   * Provides Query instances with the `catch` method exposed by Promises.
   * See `Promise.prototype.catch`
   *
   * @param {Function}
   * @return {Promise} A Query instance.
   */
  catch(...args) {
    return new Query(Promise.prototype.catch.apply(this, args));
  }
  
  /**
   * Filter results based on a filtering object, or filter function.
   *
   * @param {Object|Function} search The argument to filter by. If a function, see `Array.prototype.filter`.
   *                                 If argument is an object, then the results will contain objects that
   *                                 have all properties of the `search` object, and their values are strictly equal
   *                                 to the values of the `search` object properties.
   * @return {Query}  A Query instance with a limited number of results.
   */
  filter(search = {}) {
    if ((typeof search === 'object' && search !== null) || typeof search === 'function') {
      let fnSearch;
      
      if (typeof search === 'object') {
        const sKeys = Object.getOwnPropertyNames(search);
        
        if (sKeys.length === 0) {
          /* For no properties in the `search` object, 
           * skip calling the expensive `Array.prototype.filter` method,
           * and return the current results.
           */
          return this;
        }
        
        fnSearch = (doc) => {
        
          // Filter out non-object docs. (TO BE REMOVED!)
          if (typeof doc === 'undefined' || doc === null) {
            return false;
          }
          
          
          for (const key of sKeys) {
            if (doc[key] !== search[key]) {
              return false;
            }
          }
          
          return true;
        };
      
      } else {
        // Search using a filter function.
        fnSearch = search;
      }
      
      return this.then((docs) => {
        // Do not call the filter function if the array is empty.
        return (docs.length > 0 ? docs.filter(fnSearch) : docs);
      });
    } else {
      return new Query(Promise.reject(new TypeError('Invalid non-object filter')));
    }
  }
  
  /**
   * Limit the number of results in the returned array, to a given n quantity.
   *
   * @param {number} n  The number of results to be returned.
   * @return {Query}  A Query instance with a limited number of results.
   */
  limit(n = Infinity) {
    // Without an argument provided, return all items in the array.
    if (typeof n === 'number' && false === Number.isNaN(n) && n >= 0) {
      // Argument must be of type number, not NaN and positive.
      if (n === 0) {
        // Return 0 results. Bypass any array slicing.
        return new Query(Promise.resolve([]));
      } else if (Number.isFinite(n) === false) {
        // Infinity. Return max available results, meaning no need to slice the array.
        return this;
      } else {
        return this.then((docs) => {
          /* If the limit parameter provided is greater than the length
           * of the array, return the original array. Otherwise slice to limit.
           */
          return (docs.length > n ? docs.slice(0, n) : docs);
        });
      }
    } else {
      throw new TypeError('Positive integer parameter expected');
    }
  }
  
  /**
   * TODO: Sort results based on a function.
   * 
   * @param {Function} fn Sort function. See `Array.prototype.sort` for sorting function arguments.
   * @return {Query} A Query instance.
   */
  sort(fn) {
    return this;
  }
  
  then(...args) {
    const err = new ReferenceError('Query instances define their own `then` method implementation');
    return Promise.reject(err).then(...args);
  }
}
