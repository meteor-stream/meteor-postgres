tasks = new Subscription('tasks');

tasks.addEventListener('update', function(index, msg){
  console.log("fired");
  console.log("index", index);
  console.log("msg", msg);
});

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe('tasks');
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

  console.log(db, a);

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;

      tasks.insert('tasks', ['text'], [text]);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
  var taskTable = {
      text: 'varchar (255) not null'
    };
  Postgres.createTable('tasks', taskTable);
  Meteor.publish('tasks', function(){
    return Postgres.autoSelect();
  })
}