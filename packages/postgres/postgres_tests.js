console.log('in test file');

Tinytest.add("Postgres - basics", function (test) {

  if (Meteor.isServer) {
    console.log('in test');

    //first delete table
    //Drop table work, but, it seems like the notify does not be dropped.
    Postgres.dropTable('tasks');

    // way to detect the existence of specific table?

    // Version 1
    // var taskTable = {
    //   text: ['$string', '$notnull']
    // };

    // Varsion 2
    // var taskTable = {
    //   text: ['$string', 'not null']
    // };

    // Postgres.createTable('tasks', taskTable);
  }

  test.equal(true, true);

})

