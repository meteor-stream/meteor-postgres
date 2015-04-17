 tasks = new SQL.Collection('tasks');
 users1 = new SQL.Collection('users1');

if (Meteor.isClient) {
  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var newUser = 'ko';
  var taskTable = {
    _id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    name: ['$string'],
    users1_id: ['$number']
  };
  tasks.createTable(taskTable);

  var usersTable = {
    _id: ['$number'],
    name: ['$string', '$notnull']
  };
  users1.createTable(usersTable);


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
      //console.log(newUser);
      var user = alasql('select _id from users1 where name = ?', [newUser])[0]._id;
      //console.log(user);
      var text = event.target.text.value;
      tasks.insert({
        text:text,
        checked:false,
        name: newUser,
        users1_id: user
      }, tasks);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    },
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      tasks.update({_id: this._id, "checked": !this.checked}, {"_id": {$eq: this._id}});
    },
    "click .delete": function () {
      tasks.remove({_id: {$eq: this._id}});
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
    add: function(table, paramObj) {
      tasks.ActiveRecord.insert(paramObj).save();
    },
    update: function(table, paramObj, selectObj){
      tasks.ActiveRecord.update(paramObj).where("_id = ?", selectObj._id.$eq).save();
    },
    remove: function(table, paramObj){
      tasks.ActiveRecord.remove().where("_id = ?", paramObj._id.$eq).save();
    },
    createTable: function(table, paramObj){
      tasks.createTable(table, paramObj);
    }
  });


  Meteor.publish('tasks', function () {
    var cursor = {};
    cursor._publishCursor = function(sub) {
      tasks.ActiveRecord.select('tasks._id as _id', 'tasks.text', 'tasks.checked', 'tasks.created_at', 'users1._id as users_id', 'users1.name').join(['INNER JOIN'], ["users1_id"], [["users1", '_id']]).order('created_at DESC').limit(10).autoSelect(sub);
    };
    cursor.autoSelect = tasks.ActiveRecord.select('tasks._id as _id', 'tasks.text', 'tasks.checked', 'tasks.created_at', 'users1._id as users_id', 'users1._name').join('INNER JOIN', ['_id'], ['users1:_id']).order('created_at DESC').limit(10).autoSelect;    return cursor;
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
