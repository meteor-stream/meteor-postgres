tasks = new Subscription('tasks');

tasks.addEventListener('added', function(index, msg){
  console.log("fired");
  console.log("index", index);
  console.log("msg", msg);
});
console.log(tasks, 123);

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

  var liveDb = new LiveSQL({
    host: 'localhost',
    user: 'postgres',
    password: '1234',
    database: 'public'
  });

  var closeAndExit = function() {
    liveDb.end();
    process.exit();
  };
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);

  Meteor.publish('tasks', function(){
    return liveDb.select(
      'SELECT * FROM tasks',
      [ { table: 'tasks' } ]
    );
  });

  //var taskTable = {
  //    text: 'varchar (255) not null'
  //  };
  //Postgres.createTable('tasks', taskTable);
  //Meteor.publish('tasks', function(){
  //  console.log("Tasks updating");
  //  var result = Postgres.getCursor();
  //  return result;
  //})
  //
  //setTimeout(function(){
  //  Postgres.insert('tasks',{'text':'hello'});
  //}, 5000);
}