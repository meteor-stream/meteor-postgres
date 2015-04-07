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

  var closeAndExit = function() {
    liveDb.end();
    process.exit();
  };
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);
  Meteor.publish('tasks', function(){
    console.log("Updating tasks");
    var x = liveDb;
    LiveSQL.addCursor(x);
    return x;
  });
}