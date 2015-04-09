console.log('in test file');

Tinytest.add("Postgres - basics", function (test) {

  if (Meteor.isServer) {
    console.log('in test');

    //first delete table
    Postgres.dropTable('tasks');

    var taskTable = {
      text: ['$string', '$notnull']
    };

    Postgres.createTable('tasks', taskTable);
  }

  test.equal(true, true);

})

