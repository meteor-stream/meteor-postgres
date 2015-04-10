tasks = new SQLCollection('tasks');


if (Meteor.isClient) {

  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var taskTable = {
    id: ['INT', 'AUTO_INCREMENT'],
    text: ['varchar (255)', 'not null']
  };
  tasks.createTable('tasks', taskTable);

  //tasks.loadData('tasks');


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
      });

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    }
  });
}

if (Meteor.isServer) {
  var cursor = Postgres.getCursor();

  //Postgres.select('tasks', []);
  //
  //Postgres.update('tasks', "text = 'hello world' WHERE id = 5");

  Meteor.publish('tasks', function () {
    return cursor;
  });
}