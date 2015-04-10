var selfConnection;
var buffer = [];
var reactiveData = new Tracker.Dependency;

SQLCollection = function(connection, name /* arguments */) {
  var self = this;
  var tableName = connection;
  var initiated = false;
  var unvalidated = true;
  this.createTable = function(tableName, tableDefinition) {
    // TODO: MAKE SURE THIS HANDLES TABLES THAT ALREADY EXIST (mini sql doesn't perssist data so shouldn't be an issue)
    minisql.createTable(tableName, tableDefinition);
  };

  this.select = function(args) {
    reactiveData.depend();
    return minisql.select(tableName, args);
  };

  this.insert = function(dataObj) {
    minisql.insert(tableName, dataObj);
    reactiveData.changed();
    unvalidated = dataObj.text;
    Meteor.call('add', tableName, dataObj);
  };

  this.update = function(tableName, dataObj) {
    minisql.update(tableName, dataObj);
    reactiveData.changed();
    console.log(dataObj);
    var newData = {"checked": dataObj.value};
    var newCheck = {"id": {$eq: dataObj.id}};
    console.log(newData);
    console.log(newCheck);
    Meteor.call('update', tableName, newData, newCheck);
  };

  this.remove = function(dataObj) {
    minisql.remove(tableName, dataObj);
    reactiveData.changed();
    Meteor.call('remove', tableName, dataObj);
  };

  var subscribeArgs;

  if (!(self instanceof SQLCollection)) {
    throw new Error('use "new" to construct a SQLCollection');
  }

  self._events = [];

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
  //Meteor.call('loadData', 'tasks', connection);

  //this.loadData = function(tableName){
  //  Meteor.call('loadData', tableName, connection);
  //};
  Tracker.Dependency.call(self);
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
  if (Meteor.isServer) {
    Meteor.methods({
      add: function(table, paramObj) {
        Postgres.insert(table, paramObj);
      },
      update: function(table, paramObj, selectObj) {
        console.log(paramObj);
        console.log(selectObj);
        Postgres.update(table, paramObj, selectObj);
      },
      remove: function(table, paramObj) {
        Postgres.remove(table, {"id":{$eq:paramObj}});
      }
    });
  }


  if (Meteor.isClient) {
    this.addEventListener('added', function(index, msg) {
      var tableId = msg.results[0].id;
      var text = msg.results[0].text;
      //if (unvalidated === text) {
      alasql("DELETE FROM " + tableName);
      unvalidated = "";
      //}
      for (var x = msg.results.length-1; x >= 0 ; x--) {
        var checked = msg.results[x].checked === 'f';
        alasql("INSERT INTO tasks VALUES (?,?,?)", [msg.results[x].id, msg.results[x].text, checked]);
      }
      reactiveData.changed();
    });
    this.addEventListener('changed', function(index, msg) {
      if (msg.removed){
        var tableId = msg.tableId;
        minisql.remove(msg.name, tableId);
      }
      else if (msg.modified){
        var tableId = msg.tableId;
        alasql("UPDATE " + tableName + " SET checked = ? WHERE id= ?", [msg.checked, msg.tableId]);
      }
      else {
        var tableId = msg.tableId;
        var text = msg.text;
        var checked = msg.checked;
        if (unvalidated !== "") {
          alasql("UPDATE " + tableName + " SET id = ? WHERE text= " + "'" + text + "'", [tableId]);
          unvalidated = "";
        }
        else {
          alasql("INSERT INTO " + tableName + " VALUES (?,?,?)", [tableId, text, checked]);
        }
      }
      reactiveData.changed();
    });

    //this.addEventListener('removed', function(index, msg) {
    //  var tableId = msg.tableId;
    //  minisql.remove(msg.name, tableId);
    //  reactiveData.changed();
    //});
  }
};

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
            sub.dispatchEvent(msg.msg, index, msg.fields);
            break;
          case 'changed':
            sub.splice(index, 0, msg.fields);
            sub.dispatchEvent(msg.msg, index, msg.fields);
            break;
          //case 'changed':
          //  oldRow = _.clone(sub[index]);
          //  sub[index] = _.extend(sub[index], msg.fields);
          //  sub.dispatchEvent(msg.msg, index, oldRow, sub[index]);
          //  break;
          //case 'removed':
          //  oldRow = _.clone(sub[index]);
          //  sub.splice(index, 1);
          //  sub.dispatchEvent(msg.msg, index, oldRow);
          //  break;
          //case 'removed':
          //  sub.splice(index, 0, msg.fields);
          //  sub.dispatchEvent(msg.msg, index, msg.fields);
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
SQLCollection.prototype = new Array;
_.extend(SQLCollection.prototype, Tracker.Dependency.prototype);


SQLCollection.prototype._eventRoot = function(eventName) {
  return eventName.split('.')[0];
};

SQLCollection.prototype._selectEvents = function(eventName, invert) {
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

SQLCollection.prototype.addEventListener = function(eventName, listener) {
  var self = this;
  if (typeof listener !== 'function')
    throw new Error('invalid-listener');
  self._events.push({
    name: eventName,
    root: self._eventRoot(eventName),
    listener: listener
  });
};

SQLCollection.prototype.initialValue = function(eventName, listener) {
  var result = Postgres.select('tasks');
  return result;
};

// @param {string} eventName - Remove events of this name, pass without suffix
//                             to remove all events matching root.
SQLCollection.prototype.removeEventListener = function(eventName) {
  var self = this;
  self._events = self._selectEvents(eventName, true);
};

SQLCollection.prototype.dispatchEvent = function(eventName /* arguments */) {
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

SQLCollection.prototype.reactive = function() {
  var self = this;
  self.depend();
  return self;
};
