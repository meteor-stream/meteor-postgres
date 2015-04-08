Tinytest.add("Postgres - basics", function (test) {
  // first delete table

  // then create table

  if (Meteor.isServer) {
    console.log('in test');

    //Drop table work, but, it seems like the notify does not be dropped.
    Postgres.dropTable('tasks');

    var taskTable = {
      id: ['int', 'not null'],
      text: ['varchar (255)', 'not null']
    };
    // Create Table does not create the table here, work for the original one
    Postgres.createTable('tasks', taskTable);
  }

  test.equal(true, true);

})

