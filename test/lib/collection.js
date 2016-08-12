import Collection from '../../src/collection';

export {Collection};
export default Collection;

export function isCollection(o) {
  if (!(o instanceof Collection)) {
    throw new TypeError('Not a Collection instance');
  }
}

export const proto = Collection.prototype;
export const methods = ['constructor', 'find', 'findOne', 'read'];
export const symbols = Object.getOwnPropertySymbols(proto);
