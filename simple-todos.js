tasks = new SQLCollection('tasks');


if (Meteor.isClient) {

  var taskTable = {
    id: ['int', 'not null'],
    text: ['varchar (255)', 'not null']
  };

  var b = db.createTable('tasks', taskTable);

  Template.body.helpers({
    tasks: function () {
      return tasks.select({});
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This function is called when the new task form is submitted
      var text = event.target.text.value;
      tasks.insert({
        text:text
      })

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
  var cursor = Postgres.getCursor();

  Meteor.publish('tasks', function () {
    return cursor;
  });
}