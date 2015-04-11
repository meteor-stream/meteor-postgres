var selfConnection;
var buffer = [];
var reactiveData = new Tracker.Dependency;

SQLCollection = function(connection, name /* arguments */) {
  var self = this;
  var tableName = connection;
  this.tableName = connection;
  var initiated = false;
  var unvalidated = true;
  var subscribeArgs;

  // Defining the methods that application can interact with.
  this.createTable = function(tableName, tableDefinition) {
    // TODO: MAKE SURE THIS HANDLES TABLES THAT ALREADY EXIST (mini sql doesn't perssist data so shouldn't be an issue)
    minisql.createTable(tableName, tableDefinition);
    // TODO: MAKE THIS INSERT INTO POSTGRES
    var usersTable = {name: ['$string', '$notnull']};
    //Meteor.call('createTable', 'users1', usersTable);
  };

  this.select = function(args) {
    reactiveData.depend();
    return minisql.select(tableName, args);
  };

  this.insert = function(dataObj) {
    dataObj['id'] = -1;
    minisql.insert(tableName, dataObj);
    reactiveData.changed();
    unvalidated = dataObj.text;
    // Removing ID so that server DB will automatically assign one
    delete dataObj['id'];
    Meteor.call('add', tableName, dataObj);
  };

  this.update = function(tableName, dataObj) {
    minisql.update(tableName, dataObj);
    reactiveData.changed();
    var newData = {"checked": dataObj.value};
    var newCheck = {"id": {$eq: dataObj.id}};
    Meteor.call('update', tableName, newData, newCheck);
  };

  this.remove = function(dataObj) {
    minisql.remove(tableName, dataObj);
    reactiveData.changed();
    Meteor.call('remove', tableName, dataObj);
  };

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

  // Server side methods to route to Postgres object


  // Client side listeners for notifications from server

};

if (Meteor.isServer) {
  Meteor.methods({
    add: function(table, paramObj) {
      Postgres.insert(table, paramObj);
    },
    update: function(table, paramObj, selectObj) {
      Postgres.update(table, paramObj, selectObj);
    },
    remove: function(table, paramObj) {
      Postgres.remove(table, {"id":{$eq:paramObj}});
    },
    createTable: function(table, paramObj){
      Postgres.createTable(table, paramObj);
    }
  });
}

if (Meteor.isClient) {
  // Added will only be triggered on the initial flow of data
  // Adding an entry to minisql will trigger a server side insert, but this
  // will not trigger an added event on any client
  // CAN WE RENAME TO POPULATE?
  this.addEventListener('added', function(index, msg) {
    unvalidated = "";
    console.log(msg);
    console.log(index);
    for (var x = msg.results.length-1; x >= 0 ; x--) {
      // TODO: Right now minisql.insert is not dynamic enough to be used to insert. This is
      // being worked on and eventually the following line will replace the direct reference
      // to alasql:
      // minisql.insert(tableName, msg.results[x]);
      alasql("INSERT INTO tasks VALUES (?,?,?)", [msg.results[x]._id, msg.results[x].text, msg.results[x].checked]);
    }
    reactiveData.changed();
  });
  // Changed will be triggered whenever there is a deletion or update to Postgres
  // It will also be triggered when there is a new entry while the client has the
  // page loaded.
  this.addEventListener('changed', function(index, msg) {
    // Checking to see if event is a removal from the DB
    if (msg.removed){
      var tableId = msg.tableId;
      // For the client that triggered the removal event, the data will have
      // already been removed and this is redundant.
      minisql.remove(msg.name, tableId);
    }
    // Checking to see if event is a modification of the DB
    else if (msg.modified){
      // For the client that triggered the removal event, the data will have
      // already been removed and this is redundant.
      // TODO: Right now mini.sql.update is not dynamic enough to be used to update. This being
      // worked on and evnentually the following line will replace the direct reference to
      // alasql:
      // minisql.update(tableName, msgParams) // So msgParams doesn't exist. We will have to do
      // some logic here or in alasql.
      alasql("UPDATE " + tableName + " SET checked = ? WHERE id= ?", [msg.checked, msg.tableId]);
    }
    else {
      // The message is a new insertion of a message
      var tableId = msg.tableId;
      var text = msg.text;
      var checked = msg.checked;
      // If the message was submitted by this client then the insert message triggered
      // by the server should be an update rather than an insert as that entry already
      // exists in minisql. To account for this we store that entry as 'unvalidated' variable
      if (unvalidated !== "") {
        // For the client that triggered the removal event, the data will have
        // already been removed and this is redundant.
        // TODO: Right now mini.sql.update is not dynamic enough to be used to update. This being
        // worked on and evnentually the following line will replace the direct reference to
        // alasql:
        // minisql.update(tableName, msgParams) // So msgParams doesn't exist. We will have to do
        // some logic here or in alasql.
        alasql("UPDATE " + tableName + " SET id = ? WHERE text= " + "'" + text + "'", [tableId]);
        unvalidated = "";
      }
      else {
        // TODO: Right now minisql.insert is not dynamic enough to be used to insert. This is
        // being worked on and eventually the following line will replace the direct reference
        // to alasql:
        // minisql.insert(tableName, {id: -1, text:text, checked:checked, userID: userID});
        // right now userID is not being passes in.
        alasql("INSERT INTO " + tableName + " VALUES (?,?,?)", [tableId, text, checked]);
      }
    }
    reactiveData.changed();
  });
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
            sub.dispatchEvent(msg.msg, index, msg.fields);
            break;
          case 'changed':
            sub.splice(index, 0, msg.fields);
            sub.dispatchEvent(msg.msg, index, msg.fields);
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
  var result = Postgres.select(this.tableName);
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
