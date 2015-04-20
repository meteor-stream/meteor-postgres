// Defining 2 SQL collections. The additional paramater is the postgres connection string which will only run on the server
tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
users1 = new SQL.Collection('users1', 'postgres://postgres:1234@localhost/postgres');

if (Meteor.isClient) {
  var newUser = 'kate';
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
      console.log(newUser);
      var uTasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.name').join(['OUTER JOIN'], ['users1id'], [['users1', ['id']]]).where("users1.name = ?", newUser).fetch();
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
      tasks.reactiveData.changed();
    }
  });

}

if (Meteor.isServer) {

  //tasks.ActiveRecord.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  //users1.ActiveRecord.createTable({name: ['$string']}).save();
  //tasks.ActiveRecord.createRelationship('users1', '$onetomany').save();

  // Publishing the collections
  tasks.publish('tasks', function(){
    return tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'users1.id as users1id', 'users1.name')
       .join(['INNER JOIN'], ["users1id"], [["users1", 'id']])
       .order('createdat DESC')
       .limit(100)
  });

  users1.publish('users1', function(){
    return users1.select('id', 'name')
                 .limit(100)
  });
}
