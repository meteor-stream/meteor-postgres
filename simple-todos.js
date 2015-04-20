// Defining 2 SQL collections. The additional paramater is the postgres connection string which will only run on the server
tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
users1 = new SQL.Collection('users1', 'postgres://postgres:1234@localhost/postgres');

if (Meteor.isClient) {

  // Creating schema for tables
  var taskTable = {
    id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    users1id: ['$number']
  };
  // creating table
  tasks.createTable(taskTable);

  // creating schema for second table
  var usersTable = {
    id: ['$number'],
    name: ['$string', '$notnull']
  };
  // creating second table
  users1.createTable(usersTable);


  Template.body.helpers({
    tasks: function () {
      // selecting and returning from minisql - client side database
      var uTasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.name')
                        .join(['LEFT OUTER JOIN'], ['users1id'], [['users1', ['id']]])
                        .fetch('client');
      return uTasks;
    },
    categories: function () {
      // selecting and returning from minisql
      return users1.select()
                   .fetch('client');
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // TODO: rewrite this to use '?' syntax
      // building up where string
      var value = event.target.category.value;
      var user = users1.select('id')
                       .where('name = ?', value)
                       .fetch();
      user = user[0].id;
      var text = event.target.text.value;
      // Inserting into localDB. meteor-Postgres will update the server
      tasks.insert({
        text:text,
        checked:false,
        users1id: user
      }).save();
      event.target.text.value = "";
    },
    "click .toggle-checked": function () {
      // Updating local db. meteor-Postgres will udpate the server
      tasks.update({id: this.id, "checked": !this.checked})
           .where("id = ?", this.id)
           .save();
    },
    "click .delete": function () {
      // Deleting from local db. meteor-Postgres will udpate the server
      tasks.remove()
           .where("id = ?", this.id)
           .save();
    }
  });

}

if (Meteor.isServer) {

  // Commented out calls to create tables on the server
  //tasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //users1.createTable({name: ['$string']}).save();
  //tasks.createRelationship('users1', '$onetomany').save();

  // Defining the meteor.methods to handle inserting into the serverDB. These will be automatically
  // called when inserting into the localDB. They need to be named {{collection name}}+'save'
  // This is a limitation of our implementation and will be fixed in later versions
  Meteor.methods({
    taskssave: function(input, dataArray) {
      tasks.save(input, dataArray);
    },
    tasksfetch: function(input, dataArray) {
      tasks.fetch(input, dataArray);
    },
    users1save: function(input, dataArray) {
      users1.save(input, dataArray);
    },
    users1fetch: function(input, dataArray) {
      users1.fetch(input, dataArray);
    }
  });

  // Publishing the collections
  Meteor.publish('tasks', function () {
    // For this implementation to work you must call getCursor and provide a callback with the select
    // statement that needs to be reactive. The 'caboose' on the chain of calls must be autoSelect
    // and it must be passed the param 'sub' which is defining in the anon function.
    // This is a limitation of our implementation and will be fixed in later versions
    return tasks.getCursor(function(sub){
      tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name')
           .join(['INNER JOIN'], ["users1id"], [["users1", 'id']])
           .order('createdat DESC')
           .limit(10)
           .autoSelect(sub);
    });
  });

  Meteor.publish('users1', function(){
    return users1.getCursor(function(sub) {
      users1.select('id', 'name')
            .limit(10)
            .autoSelect(sub);
    });
  })
}
