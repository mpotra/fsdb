
export default function(assert, proto, methods = [], properties = []) {
  const allProperties = properties.concat(methods);
  const _properties = Object.getOwnPropertyNames(proto).sort();
  
  assert.plan(1 + methods.length * 4 + properties.length * 5);
  assert.deepEqual(_properties, allProperties.sort(), 'contains all properties');
  
  methods.forEach((m) => {
    const propDesc = Object.getOwnPropertyDescriptor(proto, m);
    assert.equal(propDesc.enumerable, false, `[${m}] is not enumerable`);
    assert.equal(propDesc.configurable, true, `[${m}] is configurable`);
    assert.equal(propDesc.writable, true, `[${m}] is writable`);
    assert.equal(typeof proto[m], 'function', `[${m}] is a function`);
  });
  
  properties.forEach((p) => {
    const propDesc = Object.getOwnPropertyDescriptor(proto, p);
    assert.equal(propDesc.enumerable, false, `[${p}] is not enumerable`);
    assert.equal(propDesc.configurable, true, `[${p}] is configurable`);
    assert.equal(-1, Object.getOwnPropertyNames(propDesc).indexOf('writable'), `[${p}] is not a data property`);
    assert.equal(typeof propDesc.get, 'function', `[${p}] getter is a function`);
    assert.equal(typeof propDesc.set, 'undefined', `[${p}] setter is undefined`);
  });
}
