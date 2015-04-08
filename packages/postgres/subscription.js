var selfConnection;
var buffer = [];

Subscription = function(connection, name /* arguments */){
  var self = this;

  this.fetch = function(){
    return Session.get('data');
  }

  var subscribeArgs;

  if(!(self instanceof Subscription)){
    throw new Error('use "new" to construct a Subscription');
  }

  self._events = [];

  if(typeof connection === 'string'){
    // Using default connection
    subscribeArgs = Array.prototype.slice.call(arguments, 0);
    name = connection;
    if(Meteor.isClient){
      connection = Meteor.connection;
      //console.log(connection,456);
    }else if(Meteor.isServer){
      if(!selfConnection){
        selfConnection = DDP.connect(Meteor.absoluteUrl());
      }
      connection = selfConnection;
    }
  }else{
    // Subscription arguments does not use the first argument (the connection)
    subscribeArgs = Array.prototype.slice.call(arguments, 1);
  }

  Tracker.Dependency.call(self);
  // Y U No give me subscriptionId, Meteor?!
  var subsBefore = _.keys(connection._subscriptions);
  _.extend(self, connection.subscribe.apply(connection, subscribeArgs));
  var subsNew = _.difference(_.keys(connection._subscriptions), subsBefore);
  if(subsNew.length !== 1) throw new Error('Subscription failed!');
  self.subscriptionId = subsNew[0];

  buffer.push({
    connection: connection,
    name: name,
    subscriptionId: self.subscriptionId,
    instance: self
  });

  // If first store for this subscription name, register it!
  if(_.filter(buffer, function(sub){
      return sub.name === name && sub.connection === connection;
    }).length === 1){
    registerStore(connection, name);
  }

  this.addEventListener('added', function(index, msg){
    var tableId = msg.tableId;
    var text = msg.text;
    var insertText = "INSERT INTO tasks VALUES (" + tableId + ", " + "'" + text + "'" + ")";
    alasql(insertText);
    Session.set('data', db.select('tasks', {}));
  });

};

var registerStore = function(connection, name){
  connection.registerStore(name, {
    beginUpdate: function(batchSize, reset){},
    update: function(msg){
      var idSplit = msg.id.split(':');
      var sub = _.filter(buffer, function(sub){
        return sub.subscriptionId === idSplit[0];
      })[0].instance;
      if(idSplit.length === 1 && msg.msg === 'added' &&
        msg.fields && msg.fields.reset === true){
        // This message indicates a reset of a result set
        sub.dispatchEvent('reset', msg);
        sub.splice(0, sub.length);
      }else{
        var index = parseInt(idSplit[1], 10);
        var oldRow;
        sub.dispatchEvent('update', index, msg);
        switch(msg.msg){
          case 'added':
            sub.splice(index, 0, msg.fields);
            sub.dispatchEvent(msg.msg, index, msg.fields);
            break;
          case 'changed':
            oldRow = _.clone(sub[index]);
            sub[index] = _.extend(sub[index], msg.fields);
            sub.dispatchEvent(msg.msg, index, oldRow, sub[index]);
            break;
          case 'removed':
            oldRow = _.clone(sub[index]);
            sub.splice(index, 1);
            sub.dispatchEvent(msg.msg, index, oldRow);
            break;
        }
      }
      sub.changed();
    },
    endUpdate: function(){},
    saveOriginals: function(){},
    retrieveOriginals: function(){}
  });
};

// Inherit from Array and Tracker.Dependency
Subscription.prototype = new Array;
_.extend(Subscription.prototype, Tracker.Dependency.prototype);


Subscription.prototype._eventRoot = function(eventName){
  return eventName.split('.')[0];
};

Subscription.prototype._selectEvents = function(eventName, invert){
  var self = this;
  var eventRoot, testKey, testVal;
  if(!(eventName instanceof RegExp)){
    eventRoot = self._eventRoot(eventName);
    if(eventName === eventRoot){
      testKey = 'root';
      testVal = eventRoot;
    }else{
      testKey = 'name';
      testVal = eventName;
    }
  }
  return _.filter(self._events, function(event){
    var pass;
    if(eventName instanceof RegExp){
      pass = event.name.match(eventName);
    }else{
      pass = event[testKey] === testVal;
    }
    return invert ? !pass : pass;
  });
};

Subscription.prototype.addEventListener = function(eventName, listener){
  var self = this;
  if(typeof listener !== 'function')
    throw new Error('invalid-listener');
  self._events.push({
    name: eventName,
    root: self._eventRoot(eventName),
    listener: listener
  });
};

// @param {string} eventName - Remove events of this name, pass without suffix
//                             to remove all events matching root.
Subscription.prototype.removeEventListener = function(eventName){
  var self = this;
  self._events = self._selectEvents(eventName, true);
};

Subscription.prototype.dispatchEvent = function(eventName /* arguments */){
  var self = this;
  var listenerArgs = Array.prototype.slice.call(arguments, 1);
  var listeners = self._selectEvents(eventName);
  // console.log("in dispatchEvent");
  // console.log(eventName, "event name");
  // console.log(this, "this");
  // console.log(listeners, "listeners");
  // console.log(listenerArgs, "listenerArgs");
  // Newest to oldest
  for(var i = listeners.length - 1; i >= 0; i--){
    // Return false to stop further handling
    if(listeners[i].listener.apply(self, listenerArgs) === false) return false;
  }
  return true;
};

Subscription.prototype.reactive = function(){
  var self = this;
  self.depend();
  return self;
};
