This project is still in development and will likely contain serious bugs. We are targetting 4/26/2015 as our stable release date.

# meteor-postgres
Postgres integration for Meteor


![Postgres](https://s3-us-west-1.amazonaws.com/treebookicons/postgresql_logo.jpg "Postgres")![Meteor](https://s3-us-west-1.amazonaws.com/treebookicons/meteor-logo.png  "Meteor")

[Sample todos application](www.github.com/notreadyyet)
[Sample todos source](www.github.com/notreadyyet)

Reactive Postgres for Meteor.

# Implementation

We chose to make the user interface similar to that of Mongo.Collection. We

# Usage

Defining the SQL collection on both server and client.

    tasks = new SQL.Collection('tasks') // replaces Mongo.Collection('tasks');

Connecting to the Postgres Server

    tasks.connect('postgres://postgres:1234@localhost/postgres');

Defining the schema for the tables and creating the table.

    var taskTable = {
      _id: ['INT', 'AUTO_INCREMENT'],
      text: ['varchar (255)', 'not null'],
      checked: ['BOOL', 'DEFAULT true']
    };
    tasks.createTable('tasks', taskTable);

On the server

    Meteor.publish('tasks', function(){
      return tasks.getCursor();
    })

On the client:
Selecting

    // 3 valid ways to select from database
    tasks.find({});
    tasks.findOne({});
    tasks.select({});
Inserting

    tasks.insert({
      text:text,
      checked:false
    });
Updating

    tasks.update('tasks', {_id: this._id, column: "checked", value: false});
Removing

    tasks.remove(this._id);
