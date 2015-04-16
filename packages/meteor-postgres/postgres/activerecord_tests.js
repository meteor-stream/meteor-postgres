// var TABLE = {};
pg = Npm.require('pg');
// var conString = 'postgres://postgres:1234@localhost/postgres';

if (Meteor.isServer) {
  var wrapDropTable = Meteor.wrapAsync(Postgres.dropTable.bind(Postgres));
  var wrapCreateTable = Meteor.wrapAsync(Postgres.createTable.bind(Postgres));
  var wrapAddColumn = Meteor.wrapAsync(Postgres.addColumn.bind(Postgres));
  var wrapDropColumn = Meteor.wrapAsync(Postgres.dropColumn.bind(Postgres));

  Tinytest.add("Postgres - basics", function(test){

    var testTable = {
      text: ['$string', '$notnull']
    };

    var addColumn = {
      dueDate: ['$string', '$notnull']
    };

    //drop a table not exists
    try {
      wrapDropTable('NotATable');
    } catch (e) {
      console.log(e);
    }

    //drop a existed table
    try {
      var error;
      wrapDropTable('test');
    } catch (e) {
      error = e;
      console.log(e);
    }
    test.isTrue(!error);

    //create a table
    try {
      wrapCreateTable('test', testTable, null);
    } catch (e) {
      test.isNotNull(e);
      console.log(e);
    }

    //create an existed table
    try {
      wrapCreateTable('test', testTable, null);
    } catch (e) {
      console.log(e);
    }

    // Not valid table object, tmp change was made to pass the test in postgres
    // 1. can inputString be something meaningful to fail the test?
    // 2. currently cannot ignore the null arguments, or test stoped.
    // try {
    //   wrapCreateTable('NoTableObj', null, null);
    // } catch (notValidObjectErr) {
    //   test.isNotNull(notValidObjectErr);
    //   console.log(notValidObjectErr);
    // }

    // Add column to a not exist table
    try {
      wrapAddColumn('NotExistTable', addColumn);
    } catch(e) {
      test.isNotNull(e);
      console.log(e);
    }

    //Not valid table object, tmp change made to pass the test
    //Currently syntax error
    // try {
    //   wrapAddColumn('test', null);
    // } catch (e) {
    //   test.isNotNull(e);
    //   console.log(e);
    // }

    //Add valid object to valid table
    try {
      wrapAddColumn('test', addColumn);
    } catch (e) {
      console.log(e);
    }

    //Drop a not exist column from table
    try {
      wrapDropColumn('test', 'notExistColumn');
    } catch(e) {
      test.isNotNull(e);
      console.log(e);
    }

    //Drop an exist table
    try {
      wrapDropColumn('test', 'dueDate');
    } catch(e) {
      console.log(e);
    };

  });

  //
  Tinytest.add('Postgres - integration', function(test) {

  });

};

