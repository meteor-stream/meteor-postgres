This project is still under development and will likely contain minor bugs. We are targeting 4/26/2015 as our stable release date.

# [Meteor-Postgres](http://www.meteorpostgres.com/)


![Postgres](https://s3-us-west-1.amazonaws.com/treebookicons/postgresql_logo.jpg "Postgres")![Meteor](https://s3-us-west-1.amazonaws.com/treebookicons/meteor-logo.png  "Meteor")

### In this repo

* Meteor-Postgres package
* [Example todos application](spaceelephant.meteor.com)
* [Documentation](https://github.com/meteor-stream/meteor-postgres/wiki/Getting-Started)
* [Team website](http://www.meteorelephant.com/)

### Installation

Run the following from a command line.

    meteor add meteorsteam:meteor-postgres

If you want to make modifications to our package for your project, clone this repo and include the /pacakges/meteor-postgres folder in your /pacakges. You will need to add the package to your packages file in .meteor.

### Implementation

We used [Node-Postgres](https://github.com/brianc/node-postgres) on the server and [AlaSQL](https://github.com/agershun/alasql) on the client.

### Usage

This is meant to be quick demo. See the [Documentation](https://github.com/meteor-stream/meteor-postgres/wiki/Getting-Started) for more info.

        tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');

        if (Meteor.isClient) {

          var taskTable = {
            id: ['$number'],
            text: ['$string', '$notnull'],
            checked: ['$bool'],
            usersnamesid: ['$number']
          };
          tasks.createTable(taskTable);

          Template.body.helpers({
            tasks: function () {
              var Tasks = tasks.select('tasks.id', 'tasks.text', 'tasks.checked', 'tasks.createdat').fetch();
              return Tasks;
            },
          });

          Template.body.events({
            "submit .new-task": function (event) {
              var text = event.target.text.value;
              tasks.insert({
                text:text,
                checked:false,
              }).save();
              event.target.text.value = "";
            },
            "click .toggle-checked": function () {
              // Updating local db. meteor-Postgres will udpate the server
              tasks.update({id: this.id, "checked": !this.checked})
                   .where("id = ?", this.id)
                   .save();
            },
            "click .delete": function () {
              // Deleting from local db. meteor-Postgres will udpate the server
              tasks.remove()
                   .where("id = ?", this.id)
                   .save();
            }
          });

        }

        if (Meteor.isServer) {
          // Use SQL.Collection.publish
          tasks.publish('tasks', function(){
            return tasks.select('tasks.id as id', 'tasks.text', 'tasks.checked', 'tasks.createdat', 'usernames.id as usernamesid', 'usernames.name')
               .join(['INNER JOIN'], ["usernamesid"], [["usernames", 'id']])
               .order('createdat DESC')
               .limit(100)
          });
        }

### License

Released under the MIT license. See the LICENSE file for more info.
