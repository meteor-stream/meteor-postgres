/**
 * Created by Kate Jefferson on 4/17/2015.
 */
var buffer = [];
isDirty = true;

Collection = function(connection, name) {
  var self = this;
  this.unvalidated = false;
  if (!(self instanceof Collection)) {
    throw new Error('Use new to construct a SQLCollection');
  }

  this.getActiveRecord = function(connection) {
    // Alternately you could add to the Collection object with:
    self.ActiveRecord = new ActiveRecord(connection);
    return;
  };

  var reactiveData = new Tracker.Dependency;
  this.getminiActiveRecord = function(connection, reactiveData) {
    // Alternately you could add to the Collection object with:
    self.miniActiveRecord = new miniActiveRecord(connection, reactiveData);
    return;
  };
  this.tableName = connection;
  // boolean to keep track of whether the local DB has an unvalidated entry
  self._events = [];

  if (!this.tableName) {
    throw new Error('First argument to new SQLCollection must exist');
  }

  if (this.tableName !== null && typeof this.tableName !== "string") {
    throw new Error('First argument to new SQLCollection must be a string or null');
  }

  /*ACTIVE RECORD*/
  // initialize class
  this.table = connection;

  // inputString used by queries, overrides other strings
  // includes: create table, create relationship, drop table, insert
  //this.prototype = Collection.prototype;
  //if (Meteor.isServer && isDirty) {
  //  Meteor.methods({
  //      fetch: function(table, input, dataArray) {
  //        this.tableName.ActiveRecord.fetch();
  //      },
  //      save: function(table, input, dataArray) {
  //        this.ActiveRecord.save();
  //      }
  //    }
  //  );
  //  isDirty = false;
  //}

  if (Meteor.isClient) {
    // Added will only be triggered on the initial population of the database client side.
    // Data added to any client while the page is already loaded will trigger a 'changed event'
    this.addEventListener('added', function(index, msg, name) {
      //this.miniActiveRecord.remove().save('client');
      for (var x = msg.results.length - 1; x >= 0; x--) {
        this.miniActiveRecord.insert(msg.results[x], {}).save('client');
      }
      // Triggering Meteor's reactive data to allow for full stack reactivity
      //reactiveData.changed();
    });
    // Changed will be triggered whenever the server database changed while the client has the page open.
    // This could happen from an addition, an update, or a removal, from that specific client, or another client
    this.addEventListener('changed', function(index, msg, name) {
      // Checking to see if event is a removal from the DB
      if (msg.removed) {
        var tableId = msg.tableId;
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant, but it would be inefficient to fix.
        this.miniActiveRecord.remove().where("_id = ?", tableId).save('client');
      }
      // Checking to see if event is a modification of the DB
      else if (msg.modified) {
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant.
        this.miniActiveRecord.update(msg.results).where("_id = ?", tableId).save('client');
      }
      else {
        // The message is a new insertion of a message
        // If the message was submitted by this client then the insert message triggered
        // by the server should be an update rather than an insert
        // We use the unvalidated boolean variabe to keep track of this
        if (this.unvalidated) {
          this.miniActiveRecord.update(msg.results).where("_id = ?", -1).save('client');
          //reactiveData.changed();
          this.unvalidated = false;
        }
        else {
          // The data was added by another client so just a regular insert
          this.miniActiveRecord.insert(msg.results, {}).save('client');
          //reactiveData.changed();
        }
      }
    });
  }
  // setting up the connection between server and client
  var selfConnection;
  var subscribeArgs;
  if (typeof connection === 'string') {
    // Using default connection
    subscribeArgs = Array.prototype.slice.call(arguments, 0);
    name = connection;
    if (Meteor.isClient) {
      connection = Meteor.connection;
    } else if (Meteor.isServer) {
      if (!selfConnection) {
        selfConnection = DDP.connect(Meteor.absoluteUrl());
      }
      connection = selfConnection;
    }
  } else {
    // SQLCollection arguments does not use the first argument (the connection)
    subscribeArgs = Array.prototype.slice.call(arguments, 1);
  }

  var subsBefore = _.keys(connection._subscriptions);
  _.extend(self, connection.subscribe.apply(connection, subscribeArgs));
  var subsNew = _.difference(_.keys(connection._subscriptions), subsBefore);
  if (subsNew.length !== 1) throw new Error('Subscription failed!');
  self.subscriptionId = subsNew[0];

  buffer.push({
    connection: connection,
    name: name,
    subscriptionId: self.subscriptionId,
    instance: self
  });

  // If first store for this subscription name, register it!
  if (_.filter(buffer, function(sub) {
      return sub.name === name && sub.connection === connection;
    }).length === 1) {
    registerStore(connection, name);
  }
};

var miniActiveRecord = function(connection, reactiveData){
  this.table = connection;
  this.reactiveData = new Tracker.Dependency;

  // inputString used by queries, overrides other strings
  // includes: create table, create relationship, drop table, insert
  this.inputString = '';
  this.inputString2 = '';
  this.autoSelectData = '';
  this.autoSelectInput = '';

  // statement starters
  this.selectString = '';
  this.updateString = '';
  this.deleteString = '';

  // chaining statements
  this.joinString = '';
  this.whereString = '';
  this.clientWhereString = '';
  this.serverWhereString = '';

  // caboose statements
  this.orderString = '';
  this.limitString = '';
  this.offsetString = '';
  this.groupString = '';
  this.havingString = '';

  this.dataArray = [];
  this.dataArray2 = [];
  this.server = null;

  // error logging
  this.prevFunc = '';
};

 miniActiveRecord.prototype.createTable = function(tableObj) {
  var _DataTypes = {
    $number: 'integer',
    $string: 'varchar(255)',
    $json: 'json',
    $datetime: 'date',
    $float: 'decimal',
    $seq: 'serial',
    $bool: 'boolean'
  };

  var _TableConstraints = {
    $unique: 'unique',
    $check: 'check ', // value
    $exclude: 'exclude',
    $notnull: 'not null',
    $default: 'default ', // value
    $primary: 'primary key'
  };

  alasql.fn.Date = Date;

  var startString = 'CREATE TABLE ' + this.table + ' (';
  var item, subKey, valOperator, inputString = '';

  for (var key in tableObj) {
    inputString += key + ' ';
    inputString += _DataTypes[tableObj[key][0]];
    if (Array.isArray(tableObj[key]) && tableObj[key].length > 1) {
      for (var i = 1, count = tableObj[key].length; i < count; i++) {
        item = tableObj[key][i];
        if (typeof item === 'object') {
          subKey = Object.keys(item);
          valOperator = _TableConstraints[subKey];
          inputString += ' ' + valOperator + item[subKey];
        } else {
          inputString += ' ' + _TableConstraints[item];
        }
      }
    }
    inputString += ', ';
  }
  // check to see if _id already provided
  if (inputString.indexOf('_id') === -1) {
    startString += '_id serial primary key,';
  }

  this.inputString = startString + inputString + " created_at Date); ";
  this.prevFunc = 'CREATE TABLE';
   alasql(this.inputString);
   this.clearAll();
  return this;
};

miniActiveRecord.prototype.dropTable = function() {
  this.inputString = 'DROP TABLE IF EXISTS ' + this.table + ' CASCADE;';
  this.prevFunc = 'DROP TABLE';
  return this;
};

miniActiveRecord.prototype.insert = function(serverInserts, clientInserts) {

  // server
  this.dataArray = [];
  var insertString = 'INSERT INTO ' + this.table + ' (';
  var valueString = ') VALUES (', j = 1;
  for (var key in serverInserts) {
    insertString += key + ', ';     // field
    this.dataArray.push(serverInserts[key]); // data
    valueString += '$' + j++ + ', ';   // $1, $2, etc
  }

  this.inputString = insertString.substring(0, insertString.length - 2) + valueString.substring(0, valueString.length - 2) + ');';

  if (clientInserts) {
    // client
    this.dataArray2 = [];
    var insertString2 = 'INSERT INTO ' + this.table + ' (';
    var valueString2 = ') VALUES (';
    for (var key2 in clientInserts) {
      insertString2 += key2 + ', ';
      this.dataArray2.push(clientInserts[key2]);
      valueString2 += '?, ';
    }
    for (var key3 in serverInserts) {
      insertString2 += key3 + ', ';
      this.dataArray2.push(serverInserts[key3]);
      valueString2 += '?, ';
    }
    this.server = true;
    this.inputString2 = insertString2.substring(0, insertString2.length - 2) + valueString2.substring(0, valueString2.length - 2) + ');';
  }
  this.prevFunc = 'INSERT';
  return this;
};

miniActiveRecord.prototype.update = function(updates) {
  this.updateString = 'UPDATE ' + this.table + ' SET ';
  for (var key in updates) {
    if (typeof updates[key] === 'number' && !isNaN(updates[key]) || typeof(updates[key])){
      this.updateString += key + ' = ' + updates[key] + ', ';
    }
    else {
      this.updateString += key + ' = "' + updates[key] + '", ';
    }
  }
  this.updateString = this.updateString.substring(0,this.updateString.length-2);
  this.prevFunc = 'UPDATE';
  return this;
};

miniActiveRecord.prototype.remove = function() {
  this.deleteString = 'DELETE FROM ' + this.table;
  this.prevFunc = 'DELETE';
  return this;
};

miniActiveRecord.prototype.select = function(/*arguments*/) {
  var args = '';
  if (arguments.length >= 1) {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] === 'distinct') {
        args += 'DISTINCT ';
      } else {
        args += arguments[i] + ', ';
      }
    }
    args = args.substring(0, args.length - 2);
  } else {
    args += '*';
  }
  this.selectString = 'SELECT ' + args + ' FROM ' + this.table + " ";
  this.prevFunc = 'SELECT';
  return this;
};

miniActiveRecord.prototype.findOne = function(/*arguments*/) {
  if (arguments.length === 2) {
    this.inputString = 'SELECT * FROM ' + this.table + ' WHERE ' + this.table + '._id = ' + args + ' LIMIT 1;';
  } else {
    this.inputString = 'SELECT * FROM ' + this.table + ' LIMIT 1';
  }
  this.prevFunc = 'FIND ONE';
  return this;
};

miniActiveRecord.prototype.join = function(joinType, fields, joinTable) {
  if (Array.isArray(joinType)) {
    for (var x = 0, count = fields.length; x < count; x++) {
      this.joinString = " " + joinType[x] + " " + joinTable[x][0] + " ON " + this.table + "." + fields[x] + " = " + joinTable[x][0] + "." + joinTable[x][1];
    }
  } else {
    this.joinString = " " + joinType + " " + joinTable + " ON " + this.table + "." + fields + " = " + joinTable + "." + joinTable;
  }
  this.prevFunc = "JOIN";
  return this;
};

miniActiveRecord.prototype.where = function(/*Arguments*/) {
  this.dataArray = [];
  this.dataArray2 = [];

  var where = '', redux, substring1, substring2;
  where += arguments[0];
  // replace ? with rest of array
  for (var i = 1, count = arguments.length; i < count; i++) {
    redux = where.indexOf('?');
    substring1 = where.substring(0, redux);
    substring2 = where.substring(redux + 1, where.length);
    where = substring1 + '$' + i + substring2;
    this.dataArray.push(arguments[i]);
  }
  this.serverWhereString = ' WHERE ' + where;

  var where = '', redux, substring1, substring2;
  where += arguments[0];
  // replace ? with rest of array
  for (var i = 1, count = arguments.length; i < count; i++) {
    redux = where.indexOf('?');
    this.dataArray2.push(arguments[i]);
  }
  this.clientWhereString = ' WHERE ' + where;


  return this;

  //this.dataArray = [];
  //var where = '';
  //if (client === 'client') {
  //  if (Array.isArray(arguments[1])) {
  //    var array = arguments[1];
  //    where += array[1];
  //    for (var i = 1, count = array.length; i < count; i++) {
  //      this.dataArray.push(array[i]);
  //    }
  //  } else {
  //    where += arguments[0];
  //    for (var i = 1, count = arguments.length; i < count; i++) {
  //      this.dataArray.push(arguments[i]);
  //    }
  //  }
  //  this.whereString = ' WHERE ' + where;
  //} else {
  //  var redux, substring1, substring2;
  //  var argsArray = arguments;
  //  where += argsArray[0];
  //  for (var i = 1, count = argsArray.length; i < count; i++) {
  //    redux = where.indexOf('?');
  //    substring1 = where.substring(0, redux);
  //    substring2 = where.substring(redux + 1, where.length);
  //    where = substring1 + '$' + i + substring2;
  //    this.dataArray.push(argsArray[i]);
  //  }
  //  this.whereString = ' WHERE ' + where;
  //}

  //console.log(this.whereString);
  //return this;
};

miniActiveRecord.prototype.order = function(/*arguments*/) {

  var args = '';
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) {
      args += arguments[i] + ', ';
    }
    args = args.substring(0, args.length - 2);
  } else {
    args = arguments[0];
  }
  this.orderString = ' ORDER BY ' + args;
  return this;
};

miniActiveRecord.prototype.limit = function(limit) {
  this.limitString = ' LIMIT ' + limit;
  return this;
};

miniActiveRecord.prototype.offset = function(offset) {
  this.offsetString = ' OFFSET ' + offset;
  return this;
};

miniActiveRecord.prototype.group = function(group) {
  this.groupString = 'GROUP BY ' + group;
  return this;
};

miniActiveRecord.prototype.first = function(limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id ASC LIMIT ' + limit + ';';
  this.prevFunc = 'FIRST';
  return this;
};

miniActiveRecord.prototype.last = function(limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id DESC LIMIT ' + limit + ';';
  this.prevFunc = 'LAST';
  return this;
};

miniActiveRecord.prototype.take = function(limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' LIMIT ' + limit + ';';
  this.prevFunc = 'TAKE';
  return this;
};

miniActiveRecord.prototype.clearAll = function() {
  this.inputString = '';
  this.inputString2 = '';
  this.autoSelectData = '';
  this.autoSelectInput = '';

  // statement starters
  this.selectString = '';
  this.updateString = '';
  this.deleteString = '';

  // chaining statements
  this.joinString = '';
  this.whereString = '';
  this.clientWhereString = '';
  this.serverWhereString = '';

  // caboose statements
  this.orderString = '';
  this.limitString = '';
  this.offsetString = '';
  this.groupString = '';
  this.havingString = '';

  this.dataArray = [];
  this.dataArray2 = [];
  this.server = null;

  // error logging
  this.prevFunc = '';
};

miniActiveRecord.prototype.fetch = function(client) {

  this.reactiveData.depend();
  //console.log(this.reactiveData);

  //var table = this.table;
  //var prevFunc = this.prevFunc;

  var dataArray = this.dataArray;
  var starter = this.updateString || this.deleteString || this.selectString;

  var input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.clientWhereString + this.orderString + this.limitString +
  this.offsetString + this.groupString + this.havingString + ';';
  // alaSQL
  var result = alasql(input, dataArray);

  // postgres
  //console.log(448, result);
  var name = this.table + 'fetch';
  if (client !== "client") {
    input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.serverWhereString + this.orderString + this.limitString +
    this.offsetString + this.groupString + this.havingString + ';';
    Meteor.call(name, input, dataArray);
  }
  this.clearAll();
  return result;
};

miniActiveRecord.prototype.save = function(client) {

  //var table = this.table;
  //var prevFunc = this.prevFunc;

  var dataArray = this.dataArray;
  var dataArray2 = this.dataArray2;
  var starter = this.updateString || this.deleteString || this.selectString;
  var input = this.inputString2.length > 0 ? this.inputString2 : starter + this.joinString + this.clientWhereString + ';';
  // alaSQL
  //if (input = ";"){
  //  throw 'error';
  //}
  var result = alasql(input, dataArray2);
  // postgres
  var self = this;
  var name = this.table + 'save';
  if (client !== "client") {
    input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.serverWhereString + ';';
    Meteor.call(name, input, dataArray);
  }
  this.reactiveData.changed();

  this.clearAll();
  return result;
};

//if (Meteor.isServer) {
//  Meteor.methods({
//      fetch: function(table, input, dataArray) {
//        this.ActiveRecord.fetch();
//      },
//      save: function(table, input, dataArray) {
//        table.ActiveRecord.save();
//      }
//    }
//  );
//}

var registerStore = function(connection, name) {
  connection.registerStore(name, {
    beginUpdate: function(batchSize, reset) {
    },
    update: function(msg) {
      var idSplit = msg.id.split(':');
      var sub = _.filter(buffer, function(sub) {
        return sub.subscriptionId === idSplit[0];
      })[0].instance;
      if (idSplit.length === 1 && msg.msg === 'added' &&
        msg.fields && msg.fields.reset === true) {
        // This message indicates a reset of a result set
        sub.dispatchEvent('reset', msg);
        sub.splice(0, sub.length);
      } else {
        var index = parseInt(idSplit[1], 10);
        var oldRow;
        sub.dispatchEvent('update', index, msg);
        switch (msg.msg) {
          case 'added':
            sub.splice(index, 0, msg.fields);
            sub.dispatchEvent(msg.msg, index, msg.fields, msg.collection);
            break;
          case 'changed':
            sub.splice(index, 0, msg.fields);
            sub.dispatchEvent(msg.msg, index, msg.fields, msg.collection);
            break;
        }
      }
      sub.changed();
    },
    endUpdate: function() {
    },
    saveOriginals: function() {
    },
    retrieveOriginals: function() {
    }
  });
};

// Inherit from Array and Tracker.Dependency
Collection.prototype = new Array;
_.extend(Collection.prototype, Tracker.Dependency.prototype);


Collection.prototype._eventRoot = function(eventName) {
  return eventName.split('.')[0];
};

Collection.prototype._selectEvents = function(eventName, invert) {
  var self = this;
  var eventRoot, testKey, testVal;
  if (!(eventName instanceof RegExp)) {
    eventRoot = self._eventRoot(eventName);
    if (eventName === eventRoot) {
      testKey = 'root';
      testVal = eventRoot;
    } else {
      testKey = 'name';
      testVal = eventName;
    }
  }
  return _.filter(self._events, function(event) {
    var pass;
    if (eventName instanceof RegExp) {
      pass = event.name.match(eventName);
    } else {
      pass = event[testKey] === testVal;
    }
    return invert ? !pass : pass;
  });
};

Collection.prototype.addEventListener = function(eventName, listener) {
  var self = this;
  if (typeof listener !== 'function')
    throw new Error('invalid-listener');
  self._events.push({
    name: eventName,
    root: self._eventRoot(eventName),
    listener: listener
  });
};

Collection.prototype.initialValue = function(eventName, listener) {
  return Postgres.select(this.tableName);
};

// @param {string} eventName - Remove events of this name, pass without suffix
//                             to remove all events matching root.
Collection.prototype.removeEventListener = function(eventName) {
  var self = this;
  self._events = self._selectEvents(eventName, true);
};

Collection.prototype.dispatchEvent = function(eventName /* arguments */) {
  var self = this;
  var listenerArgs = Array.prototype.slice.call(arguments, 1);
  var listeners = self._selectEvents(eventName);
  // Newest to oldest
  for (var i = listeners.length - 1; i >= 0; i--) {
    // Return false to stop further handling
    if (listeners[i].listener.apply(self, listenerArgs) === false) return false;
  }
  return true;
};

Collection.prototype.reactive = function() {
  var self = this;
  self.depend();
  return self;
};
