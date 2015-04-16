
/**
 * @summary Namespace for SQL-related items
 * @namespace
 */
SQL = {};

var buffer = [];
SQL.Collection = function(connection, name) {
  var self = this;
  if (!(self instanceof SQL.Collection)) {
    throw new Error('Use new to construct a SQLCollection');
  }
  var reactiveData = new Tracker.Dependency;
  this.tableName = connection;
  // boolean to keep track of whether the local DB has an unvalidated entry
  var unvalidated = false;
  self._events = [];

  if (this.tableName !== null && typeof this.tableName !== "string") {
    throw new Error(
      'First argument to new SQLCollection must be a string or null');
  }

  // Defining the methods that application can interact with.
  this.createTable = function(tableDefinition) {
    // TODO: This will take the configuration from the cursor and will be modeled after a view
    minisql.createTable(this.tableName, tableDefinition);
    // TODO: This will also create a postgres view for the data specified by the cursor
    //var usersTable = {name: ['$string', '$notnull']};
    //Meteor.call('createTable', 'users1', usersTable);
  };

  this.select = function(returnFields, selectObj, optionsObj) {
    reactiveData.depend();
    return minisql.select(this.tableName, returnFields);
  };

  this.insert = function(dataObj) {
    dataObj['_id'] = -1;
    minisql.insert(this.tableName, dataObj);
    reactiveData.changed();
    unvalidated = true;
    delete dataObj['_id'];
    // Removing ID so that server DB will automatically assign one
    Meteor.call('add', this.tableName, dataObj);
  };

  this.update = function(dataObj, selectObj) {
    minisql.update(this.tableName, dataObj, selectObj);
    reactiveData.changed();
    Meteor.call('update', this.tableName, dataObj, selectObj);
  };

  this.remove = function(dataObj) {
    minisql.remove(this.tableName, dataObj);
    reactiveData.changed();
    Meteor.call('remove', this.tableName, dataObj);
  };

  // Adding listers to the client side to allow for full stack reactivity
  if (Meteor.isClient) {
    // Added will only be triggered on the initial population of the database client side.
    // Data added to any chient while the page is already loaded will trigger a 'changed envent'
    this.addEventListener('added', function(index, msg, name) {
      for (var x = msg.results.length - 1; x >= 0; x--) {
          minisql.insert(this.tableName, msg.results[x]);
        }
      // Triggering Meteor's reactive data to allow for full stack reactivity
      reactiveData.changed();
    });
    // Changed will be triggered whenever the server database changed while the client has the page open.
    // This could happen from an addition, an update, or a removal, from that specific client, or another client
    this.addEventListener('changed', function(index, msg, name) {
      // Checking to see if event is a removal from the DB
      if (msg.removed) {
        var tableId = msg.tableId;
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant, but it would be inefficient to fix.
        minisql.remove(name, {_id: {$eq: tableId}});
      }
      // Checking to see if event is a modification of the DB
      else if (msg.modified) {
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant.
        minisql.update(this.tableName, msg.results, {"_id": {$eq: msg.results._id}});
      }
      else {
        // The message is a new insertion of a message
        // If the message was submitted by this client then the insert message triggered
        // by the server should be an update rather than an insert
        // We use the unvalidated boolean variabe to keep track of this
        if (unvalidated) {
          minisql.update(this.tableName, msg.results, {_id: {$eq: -1}});
          reactiveData.changed();
          unvalidated = false;
        }
        else {
          // The data was added by another client so just a regular insert
          minisql.insert(this.tableName, msg.results);
        }
      }
      reactiveData.changed();
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

if (Meteor.isServer) {
  // Meteor server side methods that delegate to postgres object
  Meteor.methods({
    add: function(table, paramObj) {
      name.insert(paramObj.insert)
      Postgres.insert(table, paramObj);
    },
    update: function(table, paramObj, selectObj) {
      Postgres.update(table, paramObj, selectObj);
    },
    remove: function(table, paramObj) {
      Postgres.remove(table, paramObj);
    },
    createTable: function(table, paramObj) {
      Postgres.createTable(table, paramObj);
    }
  });

  SQL.Collection.getCursor = function(name, columns, selectObj, optionsObj, joinObj) {
    var cursor = {};
    //Creating publish
    cursor._publishCursor = function(sub) {
      Postgres.autoSelect(sub, name, columns, selectObj, optionsObj, joinObj);
    };
    cursor.autoSelect = Postgres.autoSelect;
  return cursor;
  };
}


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
SQL.Collection.prototype = new Array;
_.extend(SQL.Collection.prototype, Tracker.Dependency.prototype);


SQL.Collection.prototype._eventRoot = function(eventName) {
  return eventName.split('.')[0];
};

SQL.Collection.prototype._selectEvents = function(eventName, invert) {
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

SQL.Collection.prototype.addEventListener = function(eventName, listener) {
  var self = this;
  if (typeof listener !== 'function')
    throw new Error('invalid-listener');
  self._events.push({
    name: eventName,
    root: self._eventRoot(eventName),
    listener: listener
  });
};

SQL.Collection.prototype.initialValue = function(eventName, listener) {
  return Postgres.select(this.tableName);
};

// @param {string} eventName - Remove events of this name, pass without suffix
//                             to remove all events matching root.
SQL.Collection.prototype.removeEventListener = function(eventName) {
  var self = this;
  self._events = self._selectEvents(eventName, true);
};

SQL.Collection.prototype.dispatchEvent = function(eventName /* arguments */) {
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

SQL.Collection.prototype.reactive = function() {
  console.log(123);
  var self = this;
  self.depend();
  return self;
};
