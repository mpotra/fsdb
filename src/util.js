
/**
 * Checks the argument to be an array, or throws TypeError.
 *
 * @param {Any} arr Argument to check if an array.
 * @throws {TypeError} if the argument passed is not an array.
 * @return {Array}  Returns the argument, if it's an array.
 */
export function throwIfNotArray(arr) {
  if (false === Array.isArray(arr)) {
    throw new TypeError('Invalid collection data');
  }
  
  return arr;
}
