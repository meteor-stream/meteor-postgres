
var buffer = [];
/**
 * @summary Namespace for SQL-related items
 * @namespace
 */
SQL = {};

isDirty = true;

SQL.Collection = function(connection, name) {
  var self = this;
  this.unvalidated = false;
  var reactiveData = new Tracker.Dependency;

  if (!(self instanceof SQL.Collection)) {
    throw new Error('Use new to construct a SQLCollection');
  }

  this.getActiveRecord = function(connection) {
    // Alternately you could add to the Collection object with:
    self.ActiveRecord = new ActiveRecord(connection);
    return;
  };

  this.getminiActiveRecord = function(connection) {
    // Alternately you could add to the Collection object with:
    console.log(miniActiveRecord);
    self.miniActiveRecord = new miniActiveRecord(connection);
    return;
  };

  if (Meteor.isClient) {
    this.getminiActiveRecord(connection);
  }

  if (Meteor.isServer){
    this.getActiveRecord(connection);
  }
  this.tableName = connection;
  // boolean to keep track of whether the local DB has an unvalidated entry
  self._events = [];

  if (!this.tableName) {
    throw new Error('First argument to new SQLCollection must exist');
  }

  if (this.tableName !== null && typeof this.tableName !== "string") {
    throw new Error('First argument to new SQLCollection must be a string or null');
  }

  // initialize class
  this.table = connection;

  if (Meteor.isClient) {
    // Added will only be triggered on the initial population of the database client side.
    // Data added to any client while the page is already loaded will trigger a 'changed event'
    this.addEventListener('added', function(index, msg, name) {
      this.miniActiveRecord.remove().save('client');
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
        this.miniActiveRecord.remove().where("id = ?", tableId).save('client');
      }
      // Checking to see if event is a modification of the DB
      else if (msg.modified) {
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant.
        console.log(msg.results);
        this.miniActiveRecord.update(msg.results).where("id = ?", msg.results.id).save('client');
      }
      else {
        // The message is a new insertion of a message
        // If the message was submitted by this client then the insert message triggered
        // by the server should be an update rather than an insert
        // We use the unvalidated boolean variabe to keep track of this
        if (this.unvalidated) {
          this.miniActiveRecord.update(msg.results).where("id = ?", -1).save('client');
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
  var self = this;
  self.depend();
  return self;
};
