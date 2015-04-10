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
    },
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      tasks.update(this._id, {$set: {checked: ! this.checked}});
    },
    "click .delete": function () {
      console.log(this);
      tasks.remove(this.id);
    }
  });
}

if (Meteor.isServer) {
  //Postgres.select('students');
  //Postgres.select('students',['name', 'age']);
  //Postgres.select('students',['name', 'age'],{age: {$gt: 18}});
  //Postgres.select('students',['name', 'age'],{age: {$gt: 18}},{ name: {$lm: 1}});
  //Postgres.select('contacts',['address'],{},{ address: {$lm: 1}},{$fk: ['$loj', 'students']});
  //Postgres.update('students',{'class': 'senior', age: 30},{age: {$gt: 18}});
  //Postgres.remove('students', {age: {$gt: 20}});
  var cursor = Postgres.getCursor();

  //Postgres.select('tasks', []);
  //
  //Postgres.update('tasks', "text = 'hello world' WHERE id = 5");

  Meteor.publish('tasks', function () {
    return cursor;
  });
}