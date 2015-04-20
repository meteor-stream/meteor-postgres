// Currently all the tests based on ActiveRecord are running synchronously
// Making test Stub using decorator
var stubActiveRecord = function(name) {
  var stub = ActiveRecord();
  stub.table = name;
  stub.conString = 'postgres://postgres:1234@localhost/postgres';
  stub.wrapSave = Meteor.wrapAsync(stub.save.bind(stub));
  stub.wrapFetch = Meteor.wrapAsync(stub.fetch.bind(stub));
  return stub;
}
/**
* Simple table test
*/
var testTasksTable = {
  text: ['$string', '$notnull']
};

var testUserTable = {
  username: ['$string', '$notnull']
};

if (Meteor.isServer) {
  var testTasks = stubActiveRecord('testTasks');
  testTasks.dropTable().wrapSave(null, null);
  testTasks.createTable(testTasksTable).wrapSave(null, null);
  testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing2' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing3' }).wrapSave(null, null);
  for ( var i = 0; i < 5; i++) {
    testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  }

  var testUser = stubActiveRecord('testUser');
  testUser.dropTable().wrapSave(null, null);
  testUser.createTable(testUserTable).wrapSave(null, null);

  Tinytest.add('activerecord - basic - success', function(test) {
    var testVal = testTasks.findOne().wrapFetch(null, null);
    test.equal(typeof testVal.rows[0], 'object');
    test.equal(testVal.rows.length, 1);
  });

  Tinytest.add('activerecord - basic - failure', function(test) {
    // create already existed throw error
    test.throws(function() {
      testTasks.createTable(testTasks).wrapSave(null, null);
    });
    // throw error is schema different
    test.throws(function() {
      testTasks.insert({ text: 'failure1', username: 'eric'}).wrapSave(null, null);
    });
  });

  var testTasksTable = {
    text: ['$string', '$notnull'],
    tasknumber: ['$number', {$default: '0'}]
  };
  testTasks.dropTable().wrapSave(null, null);
  testTasks.createTable(testTasksTable).wrapSave(null, null);
  testTasks.insert( {text: 'testing1'} ).wrapSave(null, null);
  testTasks.insert( {text: 'testing2', tasknumber: 2}).wrapSave(null, null);

}


// // Connection test, should be added after the default connect string removed
Meteor.isServer && Tinytest.add('activerecord - connection failure',
  function(test) {

  }
)