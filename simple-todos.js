// Defining 2 SQL collections. The additional paramater is the postgres connection string which will only run on the server
tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
users1 = new SQL.Collection('users1', 'postgres://postgres:1234@localhost/postgres');

if (Meteor.isClient) {
  var newUser = 'ko';
  var taskTable = {
    id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    users1id: ['$number']
  };

  tasks.createTable(taskTable);

  var usersTable = {
    id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.createTable(usersTable);


  Template.body.helpers({
    tasks: function () {
      // Also where are the params for the search?
      var uTasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.name').join(['RIGHT OUTER JOIN'], ['users1id'], [['users1', ['id']]]).fetch();
      return uTasks;
    },
    categories: function () {
      return users1.select().fetch();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      var user = users1.select('id').where("name = ?", newUser).fetch();
      user = user[0].id;
      var text = event.target.text.value;
      tasks.insert({
        text:text,
        checked:false,
        users1id: user
      }).save();
      event.target.text.value = "";

      return false;
    },
    "click .toggle-checked": function () {
      tasks.update({id: this.id, "checked": !this.checked}).where("id = ?", this.id).save();
    },
    "click .delete": function () {
      tasks.remove().where("id = ?", this.id).save();
    },
    "change .catselect": function(event){
      newUser = event.target.value;
    }
  });

}

if (Meteor.isServer) {

  //tasks.ActiveRecord.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //users1.ActiveRecord.createTable({name: ['$string']}).save();
  //tasks.ActiveRecord.createRelationship('users1', '$onetomany').save();


  Meteor.methods({
    tasksfetch: function(input, dataArray) {
      tasks.fetch(input, dataArray);
    },
    taskssave: function(input, dataArray) {
      tasks.save(input, dataArray);
    },
    users1save: function(input, dataArray) {
      users1.fetch(input, dataArray);
    },
    users1fetch: function(input, dataArray) {
      users1.save(input, dataArray);
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
