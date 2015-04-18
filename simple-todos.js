 tasks = new Collection('tasks');
 users1 = new Collection('users1');

if (Meteor.isClient) {
  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  tasks.getminiActiveRecord('tasks');
  tasks.miniActiveRecord.extra = 'name';
  users1.getminiActiveRecord('users1');
  var newUser = 'ko';
  var taskTable = {
    _id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    name: ['$string'],
    users1_id: ['$number']
  };

  //var taskTable = {
  //  _id: ['$number'],
  //  text: ['$string', '$notnull'],
  //  checked: ['$bool'],
  //  users1_id: ['$number']
  //};

  console.log(tasks);
  tasks.miniActiveRecord.createTable(taskTable);
  //tasks.reactiveData.changed();

  var usersTable = {
    _id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.miniActiveRecord.createTable(usersTable);


  Template.body.helpers({
    tasks: function () {
      //tasks.reactiveData.depend();
      //console.log(tasks);
      var uTasks = tasks.miniActiveRecord.select().fetch('client');
      return uTasks;
    },
    categories: function () {
      //users1.reactiveData.depend();
      return users1.miniActiveRecord.select().fetch('client');
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      //console.log(event.target.category.value); // How to access name
      // This function is called when the new task form is submitted
      console.log(alasql('select _id from users1 where name = ?', [newUser]));
      var user = alasql('select _id from users1 where name = ?', [newUser])[0]._id;
      console.log(user);
      var text = event.target.text.value;
      tasks.miniActiveRecord.insert({
        text:text,
        checked:false,
        users1_id: user
      }, {_id:-1, name: newUser}).save();
      tasks.unvalidated = true;
      //tasks.reactiveData.changed();

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    },
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      tasks.miniActiveRecord.update({_id: this._id, "checked": !this.checked}).where("_id = ?", this._id).save();
      //tasks.reactiveData.changed();
    },
    "click .delete": function () {
      tasks.miniActiveRecord.remove().where("_id = ?", this._id).save();
      //tasks.reactiveData.changed();
    },
    "change .catselect": function(event){
      newUser = event.target.value;
      //console.log(event.target.value);
    }
  });

}

if (Meteor.isServer) {
  //tasks = new SQL.Collection('tasks');
  //users1 = new SQL.Collection('users1');

  tasks.getActiveRecord('tasks');
  users1.getActiveRecord('users1');
  //console.log('tasks =============',tasks.getActiveRecord);
  //users1.ActiveRecord.createTable({name: ['$string']}).save();
  //tasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //tasks.insert({text: 'this is a task', checked: false}).save();
  //tasks.insert({text: 'this is another task', checked: true}).save();
  //tasks.ActiveRecord.createRelationship('users1', '$onetomany').save();
  //newTasks = new ActiveRecord('newTasks');
  //newUsers = new ActiveRecord('newUsers');
  //KATE SHIT
  //kate = new ActiveRecord('kate');
  //kate.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //newTasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //newUsers.createTable({name: ['$string']}).save();
  //newTasks.createRelationship('newUsers', '$onetomany').save();

  //tasks.ActiveRecord.select('users1.name', 'tasks.text').join(['INNER JOIN'], ["users1_id"], [["users1", '_id']]).where("users1.name = ?", "kate").order('tasks.text DESC').fetch();
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

 //tasks.ActiveRecord. value = tasks.select('_id', 'text', 'checked', 'created_at').where(_id:this.user_id).order('created_at DESC').limit(10))
