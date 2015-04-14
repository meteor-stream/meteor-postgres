 tasks = new SQLCollection('tasks');
 users1 = new SQLCollection('users1');

if (Meteor.isClient) {
  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var taskTable = {
    _id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool']
  };
  tasks.createTable('tasks', taskTable);

  var usersTable = {
    _id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.createTable('users1', usersTable);
//Postgres.createTable('students', {
//  name: ['$string', '$notnull'],
//  age: ['$number'],
//  class: ['$string', {$default: '2015'}],
//  _id: ['$number', '$notnull', '$primary', '$unique']
//});


  Template.body.helpers({
    tasks: function () {
      return tasks.select();
    },
    categories: function () {
      return users1.select();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      //console.log(event.target.category.value); // How to access name
      // This function is called when the new task form is submitted
      var text = event.target.text.value;
      tasks.insert({
        text:text,
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
        tasks.update('tasks', {_id: this._id, "checked": false}, {"_id": {$eq: this._id}});
      }
      else {
        tasks.update('tasks', {_id: this._id, "checked": true}, {"_id": {$eq: this._id}});
      }
    },
    "click .delete": function () {
      tasks.remove(this._id);
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


  //here the user specifies what data the client will have access too (data for postgres , minisql's data structure, and notifications will be taken from here)
  var cursor = Postgres.getCursor('tasks', ['_id', 'text', 'checked', 'created_at'], {}, {}, {});

  //same as for cursor
  var cursor1 = Postgres.getCursor('users1', ['_id', 'name', 'created_at'], {}, {}, {});


  //Postgres.createTable('users1', {name: ['$string']});
  //Postgres.createTable('tasks', {text: ['$string'], checked: ["$bool", {$default: false}]});

  Meteor.publish('tasks', function () {
    return cursor;
  });
  Meteor.publish('users1', function(){
    return cursor1;
  })
}