 tasks = new SQL.Collection('tasks');
 users1 = new SQL.Collection('users1');

if (Meteor.isClient) {
  // TODO: Move the table definition into SQLCollection
  // To mirror the Mongo interface we should make it so taht 1 collection is 1 table
  var taskTable = {
    _id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool']
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
      tasks.update({_id: this._id, "checked": !this.checked}, {"_id": {$eq: this._id}});
    },
    "click .delete": function () {
      tasks.remove({_id: {$eq: this._id}});
    }
  });

}

if (Meteor.isServer) {
  var users1 = new ActiveRecord('users1');
  //users.createTable({name: ['$string']}).save();
  var tasks = new ActiveRecord('tasks');
  //tasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //tasks.insert({text: 'this is a task', checked: false}).save();
  //tasks.insert({text: 'this is another task', checked: true}).save();
  //tasks.createRelationship('users1', '$onetomany').save();

  //tasks.select('users1.name', 'tasks.text').join(['INNER JOIN'], ["users1_id"], [["users1", '_id']]).where("users1.name = ?", "kate").order('tasks.text DESC').fetch();

  Meteor.publish('tasks', function () {
    var cursor = {};
    //Creating publish
    cursor._publishCursor = function(sub) {
      tasks.select('_id', 'text', 'checked', 'created_at').order('created_at ASC').limit(10).autoSelect(sub);
    };
    cursor.autoSelect =  tasks.select('_id', 'text', 'checked', 'created_at').order('created_at ASC').limit(10).autoSelect;
    return cursor;
  });
  Meteor.publish('users1', function(){
    return SQL.Collection.getCursor('users1', ['_id', 'name', 'created_at'], {}, {}, {});
  })
}