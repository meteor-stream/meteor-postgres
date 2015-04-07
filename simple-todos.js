tasks = new Subscription('tasks');
tasks.addEventListener('update', function(index, msg){
  console.log("fired");
  console.log("index", index);
  console.log("msg", msg);
});



if (Meteor.isClient) {
  // This code only runs on the client
  //Template.body.helpers({
  //  tasks: tasks.update()
  //});

  var newTable = {
    id: ['int', 'not null'],
    username: ['varchar (100)', 'not null'],
    password: ['varchar (100)', 'not null'],
    name: ['varchar (255)', 'not null']
  };

  var a = db.createTable('users', newTable);

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;

      // tasks.insert('tasks', ['text'], [text]);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
  var liveDb = new LiveSQL('postgres://postgres:1234@localhost/postgres', 'notify');
  //liveDb.select._publishCursor  = function(sub) {
  //  var self = this;
  //  var initLength;
  //
  //  sub.onStop(function(){
  //    self.stop();
  //  });
  //
  //  // Send reset message (for code pushes)
  //  sub._session.send({
  //    msg: 'added',
  //    collection: sub._name,
  //    id: sub._subscriptionId,
  //    fields: { reset: true }
  //  });
  //
  //  self.on('update', function(rows){
  //    if(sub._ready === false){
  //      initLength = rows.length;
  //      if(initLength === 0) sub.ready();
  //    }
  //  });
  //
  //  function selectHandler(eventName, fieldArgument, indexArgument, customAfter){
  //    // Events from mysql-live-select are the same names as the DDP msg types
  //    self.on(eventName, function(/* row, [newRow,] index */){
  //      sub._session.send({
  //        msg: eventName,
  //        collection: sub._name,
  //        id: sub._subscriptionId + ':' + arguments[indexArgument],
  //        fields: fieldArgument !== null ? arguments[fieldArgument] : undefined
  //      });
  //      if(customAfter) customAfter();
  //    });
  //  }
  //
  //  selectHandler('added', 0, 1, function(){
  //    if(sub._ready === false &&
  //      self.data.length === initLength - 1){
  //      sub.ready();
  //    }
  //  });
  //  selectHandler('changed', 1, 2);
  //  selectHandler('removed', null, 1);
  //};

  var closeAndExit = function() {
    liveDb.end();
    process.exit();
  };
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);
  Meteor.publish('tasks', function(){
    var x = liveDb.select(
      'SELECT * FROM tasks',
      [ { table: 'tasks' } ]
    );
    LiveSQL.addCursor(x);
    return x;
  });
}