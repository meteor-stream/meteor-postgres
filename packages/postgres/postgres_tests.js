Tinytest.add("Postgres - basics", function (test) {
  // first delete table
  if (Meteor.isServer) {
    console.log('test run');
    Postgres.dropTable('tasks');
    test.isTrue(true);
  }
  // then create table
})

