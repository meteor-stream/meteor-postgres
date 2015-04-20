This project is still under development and will likely contain minor bugs. We are targeting 4/26/2015 as our stable release date.

# meteor-postgres
Postgres integration for Meteor


![Postgres](https://s3-us-west-1.amazonaws.com/treebookicons/postgresql_logo.jpg "Postgres")![Meteor](https://s3-us-west-1.amazonaws.com/treebookicons/meteor-logo.png  "Meteor")

Included in this repo is a sample-todos application to serve as an example.

Reactive Postgres for Meteor.

# Installation

Run the following from a command line

    meteor add meteorsteam:meteor-postgres

If you want to make modifications to our package for your project, clone this repo and include the /pacakges/meteor-postgres folder in your /pacakges.

Either way you will need to add the following to .meteor/packages

    meteorsteam:meteor-postgres



# Implementation

The ORM is designed after Ruby's [active record](https://github.com/rails/rails/tree/master/activerecord). MiniSQL is implemented using [alasql](https://github.com/agershun/alasql).

# Usage


This is meant to be quick demo. See the [wiki](https://github.com/meteor-stream/meteor-postgres/wiki/Getting-Started) for official documentation.

        tasks = new SQL.Collection('tasks', 'postgres://postgres:1234@localhost/postgres');
        
        if (Meteor.isClient) {
        
          // Creating schema for tables
          var taskTable = {
            id: ['$number'],
            text: ['$string', '$notnull'],
            checked: ['$bool'],
            users1id: ['$number']
          };
          // creating table
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
          Meteor.methods({
            taskssave: function(input, dataArray) {
              tasks.save(input, dataArray);
            },
          });
        
          // Publishing the collections
          Meteor.publish('tasks', function () {
            return tasks.getCursor(function(sub){
              tasks.select('id', 'text', 'checked', 'createdat').order('createdat DESC').limit(10).autoSelect(sub);
            });
          });
        }



# License
Released under the MIT license. See the LICENSE file for more info.
