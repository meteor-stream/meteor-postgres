 tasks = new Collection('tasks');
 users1 = new Collection('users1');

if (Meteor.isClient) {
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  tasks.getminiActiveRecord('tasks');
  tasks.miniActiveRecord.extra = 'name';
  users1.getminiActiveRecord('users1');
  var newUser = 'paulo';
  var taskTable = {
    _id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    name: ['$string'],
    users1_id: ['$number']
  };

  // This should call tasks.create table which should delgate to tasks.miniActiveRecord
  tasks.miniActiveRecord.createTable(taskTable);

  var usersTable = {
    _id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.miniActiveRecord.createTable(usersTable);


  Template.body.helpers({
    tasks: function () {
      // this should call tasks.select. which should delegate to tasks.miniActiveRecord
      // Also where are the params for the search?
      var uTasks = tasks.miniActiveRecord.select().fetch('client');
      return uTasks;
    },
    categories: function () {
      return users1.miniActiveRecord.select().fetch('client');
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      //console.log(event.target.category.value); // How to access name
      var user = alasql('select _id from users1 where name = ?', [newUser]);
      console.log(user);
      user = user[0]._id;
      var text = event.target.text.value;
      // this should call tasks.insert which should delegate to tasks.miniactive record
      tasks.miniActiveRecord.insert({
        text:text,
        checked:false,
        users1_id: user
      }, {_id:-1, name: newUser}).save();
      tasks.unvalidated = true;
      event.target.text.value = "";

      return false;
    },
    "click .toggle-checked": function () {
      // this should call tasks.update which should delegate
      tasks.miniActiveRecord.update({_id: this._id, "checked": !this.checked}).where("_id = ?", this._id).save();
    },
    "click .delete": function () {
      tasks.miniActiveRecord.remove().where("_id = ?", this._id).save();
    },
    "change .catselect": function(event){
      newUser = event.target.value;
    }
  });

}

if (Meteor.isServer) {
  tasks.getActiveRecord('tasks');
  users1.getActiveRecord('users1');
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
      tasks.ActiveRecord.select('tasks._id as _id', 'tasks.text', 'tasks.checked', 'tasks.created_at', 'users1._id as users_id', 'users1.name').join(['INNER JOIN'], ["users1_id"], [["users1", '_id']]).order('created_at DESC').limit(10).autoSelect(sub);
    };
    cursor.autoSelect = tasks.ActiveRecord.select('tasks._id as _id', 'tasks.text', 'tasks.checked', 'tasks.created_at', 'users1._id as users1id', 'users1._name').join('INNER JOIN', ['_id'], ['users1:_id']).order('created_at DESC').limit(10).autoSelect;
    return cursor;
  });

  Meteor.publish('users1', function(){
    var cursor = {};
    cursor._publishCursor = function(sub) {
      users1.ActiveRecord.select('_id', 'name').limit(10).autoSelect(sub);
    };
    cursor.autoSelect = users1.ActiveRecord.select('_id', 'name').limit(10).autoSelect;
    return cursor;
  })
}
