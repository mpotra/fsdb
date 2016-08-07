/**
 * Quick and dirty implementation of a ODM database system,
 * that maps to JSON files.
 *
 * Each database is a mapping to a directory,
 * where the JSON files are treated as document collections.
 *
 */
import fs from 'fs';
import {sep as pathSeparator} from 'path';
import Collection from './collection';

const colNameValidator = /^[A-z0-9\-_\.]+$/igm;
const colFilenameValidator = /^[A-z0-9\-\.]+\.json$/igm;
const NOT_CONNECTED = Promise.reject(new TypeError('Not connected'));

const readDir = (path, options = {}) => new Promise(function(resolve, reject) {
  fs.readdir(path, options, (err, files) => {
    if (!err) {
      resolve(files);
    } else {
      reject(err);
    }
  });
});

const readFile = (path, options = {}) => new Promise(function(resolve, reject) {
  fs.readFile(path, options, (err, data) => {
    if (!err) {
      resolve(data);
    } else {
      reject(err);
    }
  });
});

function createFSEventHandler(db) {
  return function onchange(event, filename) {
    // TODO: monitor for file changes.
    // Maybe use `chokidar` lib instead of `fs.watch()` ?
  };
}

function createConnection(db, path) {
  return {
    watcher: fs.watch(path, createFSEventHandler(db)),
    path: ensurePathSeparator(path),
    close: function() {
      return this.watcher.close();
    }
  };
}

function ensurePathSeparator(path) {
  if (path[path.length - 1] !== pathSeparator) {
    return `${path}${pathSeparator}`;
  }
  
  return path;
}


function isFunction(fn) {
  return (typeof fn === 'function');
}

function triggerDatabaseOnConnect(db) {
  db._queueOnConnect
    // First pass: retrieve only functions from the queue.
    .filter(isFunction)
    // Execute each function.
    .forEach((fn) => fn());
  
  // Return. Last pass: eliminate any one-time functions.
  return db._queueOnConnect.filter(isFunction);
}

export default class Database {
  constructor(path = undefined) {
    this._cache = {};
    this._connection = null;
    this._connected = NOT_CONNECTED;
    this._queueOnConnect = [];
    this._availableCollections = [];
    this._path = path;
  }
  
  get connectedState() {
    const db = this;
    
    return db._connected.then((self) => {
      if (db._connection === null) {
        return (db._connected = NOT_CONNECTED);
      }
      
      return self;
    });
  }
  
  get path() {
    return ensurePathSeparator(this._connection ? this._connection.path : this._path || '');
  }
  
  get isOnline() {
    return false;
  }
  
  static connect(path) {
    const db = new Database(path);
    return db.connect();
  }
  
  connect(path = undefined) {
    const db = this;
    path = path || db._path;
    
    let connectedStateResolve;
    let connectedStateReject;
    
    const __connectedState = db.connectedState;
    
    db._connected = new Promise((resolve, reject) => {
      connectedStateResolve = resolve;
      connectedStateReject = reject;
    });

    
    return __connectedState.then(() => {
      const err = new TypeError('Already connected');
      connectedStateResolve(db);
      throw err;
    }, () => {
      const connecting = readDir(path)
        // filter JSON files
        .then((files) => db._availableCollections = files.filter((name) => colFilenameValidator.test(name)))
        // Watch the directory (database dir)
        .then(() => db._connection = createConnection(db, path))
        // Return a Database reference.
        .then(() => db);
        
      // Propagate the onConnect event.
      connecting.then(triggerDatabaseOnConnect).then((queue) => db._queueOnConnect = queue);
      
      // Resolve connectedState promise, based on the results so far.
      connecting.then(connectedStateResolve, connectedStateReject);
      
      return connecting;
    });
  }
  
  disconnect() {
    const db = this;
    return db._connected.then(() => {
      if (db._connection) {
        db._connection.close();
        db._connection = null;
      }
      
      db._connected = NOT_CONNECTED;
    }, (e) => {
      throw new TypeError('Database not connected');
    });
  }
  
  collection(name) {
    if (typeof name !== 'string') {
      throw new TypeError('Expected string type of collection name');
    }
    
    name = name.trim();
    
    if (name === '') {
      throw new TypeError('Collection name cannot be an empty string');
    }
    
    if (false === colNameValidator.test(name)) {
      throw new TypeError('Invalid collection name');
    }
    
    const db = this;
    
    if (typeof db._cache[name] === 'object' && db._cache[name] !== null) {
      return db._cache[name];
    }
    
    const collection = db._cache[name] = new Collection(name);
    
    collection._read = () => {
      const whenConnected = db.connectedState.catch((e) => {
        let onConnect = () => { throw new TypeError('Early trigger'); };
        
        const onceConnected = () => {
          db._queueOnConnect[index] = undefined;
          onConnect();
        };
        
        const promiseOnConnect = new Promise((resolve, reject) => {
          onConnect = resolve;
        });
        
        const index = db._queueOnConnect.push(onceConnected);
        
        return promiseOnConnect;
      });
      
      
      return whenConnected
        .then(() => readFile(`${db.path}${name}.json`))
        .then((data) => JSON.parse(data.toString()))
        .then((data) => {
          if (!Array.isArray(data)) {
            throw new TypeError('Collection data is corrupt: expected Array');
          }
          return data;
        });
    };
    
    return collection;
  }
}
