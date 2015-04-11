 tasks = new SQLCollection('tasks');

if (Meteor.isClient) {
  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var taskTable = {
    id: ['INT', 'AUTO_INCREMENT'],
    text: ['varchar (255)', 'not null'],
    checked: ['BOOL', 'DEFAULT true']
  };
  tasks.createTable('tasks', taskTable);


  Template.body.helpers({
    tasks: function () {
      return tasks.select({});
    },
    categories: function() {
      return [
        {name:'eddie'},
        {name:'paulo'},
        {name:'Bill.K.Miller'},
        {name:'eric'},
        {name:'kate'}
      ];
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      console.log(event.target.category.value); // How to access name
      // This function is called when the new task form is submitted
      var text = event.target.text.value;
      tasks.insert({
        value:text,
        checked:false
      });

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    },
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      if (this.checked) {
        tasks.update('tasks', {id: this.id, column: "checked", value: false});
      }
      else {
        tasks.update('tasks', {id: this.id, column: "checked", value: true});
      }
    },
    "click .delete": function () {
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

  Meteor.publish('tasks', function () {
    return cursor;
  });
}