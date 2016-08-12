import Query from '../../src/query';

export {Query};
export default Query;

export function isQuery(o) {
  if (!(o instanceof Query)) {
    throw new TypeError('Not a Query instance');
  }
}

export const proto = Query.prototype;
export const methods = ['catch', 'constructor', 'filter', 'limit', 'sort', 'then'];
export const symbols = [];

