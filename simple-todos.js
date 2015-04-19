tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
users1 = new SQL.Collection('users1', 'postgres://postgres:1234@localhost/postgres');

if (Meteor.isClient) {

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
      var uTasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.name')
                        .join(['OUTER JOIN'], ['users1id'], [['users1', ['id']]])
                        .fetch('client');
      return uTasks;
    },
    categories: function () {
      return users1.select()
                   .fetch('client');
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      var user = alasql('select id from users1 where name = ?', [event.target.category.value]);
      user = user[0].id;
      var text = event.target.text.value;
      tasks.insert({
        text:text,
        checked:false,
        users1id: user
      }).save();
      //tasks.unvalidated = true;
      event.target.text.value = "";
      return false;
    },
    "click .toggle-checked": function () {
      tasks.update({id: this.id, "checked": !this.checked})
           .where("id = ?", this.id)
           .save();
    },
    "click .delete": function () {
      tasks.remove()
           .where("id = ?", this.id)
           .save();
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
    taskssave: function(input, dataArray) {
      tasks.save(input, dataArray);
    },
    users1save: function(input, dataArray) {
      users1.fetch(input, dataArray);
    },
  });


  Meteor.publish('tasks', function () {
    var cursor = {};
    cursor._publishCursor = function(sub) {

      // Why do we need to write this twice??
      tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name')
           .join(['INNER JOIN'], ["users1id"], [["users1", 'id']])
           .order('createdat DESC')
           .limit(10)
           .autoSelect(sub);
    };
    cursor.autoSelect = tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name')
                             .join('INNER JOIN', ['id'], ['users1:id'])
                             .order('createdat DESC')
                             .limit(10)
                             .autoSelect;
    return cursor;
  });

  Meteor.publish('users1', function(){
    var cursor = {};
    cursor._publishCursor = function(sub) {
      users1.select('id', 'name')
            .limit(10)
            .autoSelect(sub);
    };
    cursor.autoSelect = users1.select('id', 'name')
                              .limit(10)
                              .autoSelect;
    return cursor;
  })
}
