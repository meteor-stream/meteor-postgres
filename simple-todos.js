// Defining 2 SQL collections. The additional paramater is the postgres connection string which will only run on the server
tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
usernames = new SQL.Collection('usernames', 'postgres://postgres:1234@localhost/postgres');

if (Meteor.isClient) {
  var newUser = 'ko';
  var taskTable = {
    id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    usernamesid: ['$number']
  };

  tasks.createTable(taskTable);

  var usernamesTable = {
    id: ['$number'],
    name: ['$string', '$notnull']
  };
  usernames.createTable(usernamesTable);


  Template.body.helpers({
    tasks: function () {
      var uTasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'usernames.name')
                        .join(['OUTER JOIN'], ['usernamesid'], [['usernames', ['id']]])
                        .where("usernames.name = ?", newUser)
                        .fetch();
      return uTasks;
    },
    categories: function () {
      return usernames.select()
                      .fetch();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      var user = usernames.select('id')
                          .where("name = ?", newUser)
                          .fetch();
      user = user[0].id;
      var text = event.target.text.value;
      tasks.insert({
        text:text,
        checked:false,
        usernamesid: user
      }).save();
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
      tasks.reactiveData.changed();
    }
  });

}

if (Meteor.isServer) {

  // tasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
  // usernames.createTable({name: ['$string']}).save();
  // tasks.createRelationship('usernames', '$onetomany').save();

  // Publishing the collections
  tasks.publish('tasks', function(){
    return tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'usernames.id as usernamesid', 'usernames.name')
       .join(['INNER JOIN'], ["usernamesid"], [["usernames", 'id']])
       .order('createdat DESC')
       .limit(100)
  });

  usernames.publish('usernames', function(){
    return usernames.select('id', 'name')
                 .limit(100)
  });
}
