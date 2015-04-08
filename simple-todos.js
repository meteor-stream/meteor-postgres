Meteor.methods({
  dbAdd: function(data, data1){
    var insertText = "INSERT INTO tasks VALUES (" + data + ", " + "'" + data1 + "'" + ")";
    // console.log(insertText);
    alasql(insertText);
    Template.body.tasks = alasql('select * from tasks');
  },
  add: function(text){
    Postgres.insert('tasks', {id: 49, text:text});
  }
});

tasks = new Subscription('tasks');


if (Meteor.isClient) {
  console.log(Meteor.subscribe(tasks));
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

  var taskTable = {
    id: ['int', 'not null'],
    text: ['varchar (255)', 'not null']
  };

  var a = db.createTable('users', newTable);
  var b = db.createTable('tasks', taskTable);

  Template.body.helpers({
    tasks: function () {
      var x = tasks;
      console.log(x);
      return x;
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;

      Meteor.add(text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
  var cursor = Postgres.getCursor();

  Meteor.publish('tasks', function(){
    return cursor;
  });
}