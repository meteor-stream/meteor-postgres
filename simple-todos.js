Meteor.methods({
  dbAdd: function(data, data1){
    var insertText = "INSERT INTO tasks VALUES (" + data + ", " + "'" + data1 + "'" + ")";
    alasql(insertText);
    Template.body.tasks = alasql('select * from tasks');
  },
  add: function(text){
    console.log("add", text);
    db.insert(text);
  }
  //populate: function(){
  //  var newValues = Postgres.select('tasks');
  //  console.log(newValues);
  //}
});

tasks = new Subscription('tasks');


if (Meteor.isClient) {
  // This code only runs on the client
  //Template.body.helpers({
  //  tasks: tasks.update()
  //});
  //var newTable = {
  //  id: ['int', 'not null'],
  //  username: ['varchar (100)', 'not null'],
  //  password: ['varchar (100)', 'not null'],
  //  name: ['varchar (255)', 'not null']
  //};

  var taskTable = {
    id: ['int', 'not null'],
    text: ['varchar (255)', 'not null']
  };

  //var a = db.createTable('users', newTable);
  var b = db.createTable('tasks', taskTable);

  Template.body.helpers({
    tasks: function () {
      return tasks.select('tasks', {});
    }
  });

  //var initialResults = tasks.initialValue();
  //
  //db.insert(initialResults);
  //
  //console.log(initialResults);

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;
      console.log('inside event');
      Meteor.call('add', text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
  //Meteor.call('populate');
}

if (Meteor.isServer) {
  // KATE TESTS //
  //Postgres.createTable('students', {
  //  name: ['$string', '$notnull'],
  //  age: ['$number'],
  //  class: ['$string', {$default: '2015'}],
  //  _id: ['$seq', '$primary', '$notnull']
  //});
  //Postgres.select('students');
  //Postgres.select({students: ['name', 'age']});
  //Postgres.select({students: ['name', 'age']}, {age: {$gt: 18}});
  //Postgres.select({students: ['name', 'age']},{age: {$gt: 18}},{ name: {$lm: 1}});
  var cursor = Postgres.getCursor();

  Meteor.publish('tasks', function () {
    return cursor;
  });
}