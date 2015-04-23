// Defining 2 SQL collections. The additional paramater is the postgres connection string which will only run on the server
tasks = new SQL.Collection('tasks', 'postgres://meteor:Meteor1234@191.238.146.165/meteor');
username = new SQL.Collection('username', 'postgres://meteor:Meteor1234@191.238.146.165/meteor');

if (Meteor.isClient) {
  var newUser = 'all';
  var taskTable = {
    id: ['$number'],
    text: ['$string', '$notnull'],
    checked: ['$bool'],
    usernameid: ['$number']
  };

  tasks.createTable(taskTable);

  var usersTable = {
    id: ['$number'],
    name: ['$string', '$notnull']
  };
  username.createTable(usersTable);


  Template.body.helpers({
    usernames: function () {
      return username.select()
        .fetch();
    },
    tasks: function () {
      if (newUser === 'all'){
          return tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'username.name')
            .join(['OUTER JOIN'], ['usernameid'], [['username', ['id']]])
            .fetch();
      }
      else {
        return tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'username.name')
          .join(['OUTER JOIN'], ['usernameid'], [['username', ['id']]])
          .where("name = ?", newUser)
          .fetch();
      }
    }
  });


  Template.body.events({
    "submit .new-task": function (event) {
      if (event.target.category.value){
        var user = username.select('id')
                     .where("name = ?", event.target.category.value)
                     .fetch();
        user = user[0].id;
        var text = event.target.text.value;
        tasks.insert({
          text:text,
          checked:false,
          usernameid: user
        }).save();
        event.target.text.value = "";
      } else{
        alert("please add a user first");
      }
      return false;
    },
    "submit .new-user": function (event) {
      var text = event.target.text.value;
      username.insert({
        name:text
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

   //tasks.createTable({text: ['$string'], checked: ["$bool", {$default: false}]}).save();
   //username.createTable({name: ['$string', '$unique']}).save();
   tasks.createRelationship('username', '$onetomany').save();


  username.insert({name:'all'}).save();
  // Publishing the collections
  tasks.publish('tasks', function(){
    return tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'username.id as usernameid', 'username.name')
       .join(['INNER JOIN'], ["usernameid"], [["username", 'id']])
       .order('createdat DESC')
       .limit(100);
  });

  username.publish('username', function(){
    return username.select('id', 'name')
                   .order('createdat DESC')
                   .limit(100);
  });
}
