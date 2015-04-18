 tasks = new SQL.Collection('tasks');
 users1 = new SQL.Collection('users1');

if (Meteor.isClient) {
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var newUser = 'ko';
  var taskTable = {
    id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    users1id: ['$number']
  };

  // This should call tasks.create table which should delgate to tasks.miniActiveRecord
  tasks.miniActiveRecord.createTable(taskTable);

  var usersTable = {
    id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.miniActiveRecord.createTable(usersTable);


  Template.body.helpers({
    tasks: function () {
      // this should call tasks.select. which should delegate to tasks.miniActiveRecord
      // Also where are the params for the search?
      var uTasks = tasks.miniActiveRecord.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.name').join(['OUTER JOIN'], ['users1id'], [['users1', ['id']]]).fetch('client');
      return uTasks;
    },
    categories: function () {
      return users1.miniActiveRecord.select().fetch('client');
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      //console.log(event.target.category.value); // How to access name
      var user = alasql('select id from users1 where name = ?', [newUser]);
      console.log(user);
      user = user[0].id;
      var text = event.target.text.value;
      // this should call tasks.insert which should delegate to tasks.miniactive record
      tasks.miniActiveRecord.insert({
        text:text,
        checked:false,
        users1id: user
      }, {id:-1}).save();
      tasks.unvalidated = true;
      event.target.text.value = "";

      return false;
    },
    "click .toggle-checked": function () {
      // this should call tasks.update which should delegate
      tasks.miniActiveRecord.update({id: this.id, "checked": !this.checked}).where("id = ?", this.id).save();
    },
    "click .delete": function () {
      tasks.miniActiveRecord.remove().where("id = ?", this.id).save();
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
        tasks.ActiveRecord.fetch(input, dataArray);
      },
      taskssave: function(input, dataArray) {
        tasks.ActiveRecord.save(input, dataArray);
      },
      users1save: function(input, dataArray) {
        users1.ActiveRecord.fetch(input, dataArray);
      },
      users1fetch: function(input, dataArray) {
        users1.ActiveRecord.save(input, dataArray);
      }
    });


  Meteor.publish('tasks', function () {
    var cursor = {};
    cursor._publishCursor = function(sub) {
      tasks.ActiveRecord.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name').join(['INNER JOIN'], ["users1id"], [["users1", 'id']]).order('createdat DESC').limit(10).autoSelect(sub);
    };
    cursor.autoSelect = tasks.ActiveRecord.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name').join('INNER JOIN', ['id'], ['users1:id']).order('createdat DESC').limit(10).autoSelect;
    return cursor;
  });

  Meteor.publish('users1', function(){
    var cursor = {};
    cursor._publishCursor = function(sub) {
      users1.ActiveRecord.select('id', 'name').limit(10).autoSelect(sub);
    };
    cursor.autoSelect = users1.ActiveRecord.select('id', 'name').limit(10).autoSelect;
    return cursor;
  })
}
