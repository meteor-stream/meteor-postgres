tasks = new Subscription('tasks');


if (Meteor.isClient) {

  var taskTable = {
    id: ['int', 'not null'],
    text: ['varchar (255)', 'not null']
  };

  var b = db.createTable('tasks', taskTable);

  Template.body.helpers({
    tasks: function () {
      return tasks.select('tasks', {});
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;
      Meteor.call('add', text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
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
  });
  var cursor = Postgres.getCursor();

  Meteor.publish('tasks', function () {
    return cursor;
  });
}