console.log('in test file');

Tinytest.add("Postgres - basics", function (test) {
  // first delete table

  // then create table

  if (Meteor.isServer) {
    console.log('in test');

    //Drop table work, but, it seems like the notify does not be dropped.
    Postgres.dropTable('tasks');

    // way to detect the existence of specific table?

    // var taskTable = {
    //   text: [Postgres._DataTypes['$string'], Postgres._TableConstraints['$notnull']]
    // };

    var taskTable = {
      text: [Postgres._DataTypes['$string'], 'not null']
    };
    // Create Table does not create the table here, work for the original one
    Postgres.createTable('tasks', taskTable);

    // Postgres.createTable('students', { name: [$string, $notnull], age: [$number] });

    // var newTable = {
    //   dueDate: ['varchar (255)', 'not null']
    // };

    // Postgres.addColumn('tasks', newTable);


  }

  test.equal(true, true);

})

