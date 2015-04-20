// Currently all the tests based on ActiveRecord are running synchronously
// Making test Stub using decorator
var ActiveRecordStub = function(name) {
  var stub = ActiveRecord();
  stub.table = name;
  stub.conString = 'postgres://postgres:1234@localhost/postgres';
  stub.wrapSave = Meteor.wrapAsync(stub.save.bind(stub));
  stub.wrapFetch = Meteor.wrapAsync(stub.fetch.bind(stub));
  return stub;
};

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
  var testTasks = ActiveRecordStub('testTasks');
  testTasks.dropTable().wrapSave(null, null);
  testTasks.createTable(testTasksTable).wrapSave(null, null);
  testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing2' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing3' }).wrapSave(null, null);
  for ( var i = 0; i < 5; i++) {
    testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  }

  var testUser = ActiveRecordStub('testUser');
  testUser.dropTable().wrapSave(null, null);
  testUser.createTable(testUserTable).wrapSave(null, null);

  //Should test the operation defined in the ActiveRecord and return result successfully
  Tinytest.addAsync('activerecord - basic - success', function(test, onComplete) {
    var findOneResult1 = testTasks.findOne().wrapFetch(null, null);
    var findOneResult2 = testTasks.findOne(1).wrapFetch(null, null);
    test.equal(typeof findOneResult1.rows[0], 'object');
    test.equal(findOneResult1.rows.length, 1);
    test.equal(findOneResult1.rows[0].text, 'testing1');
    test.equal(typeof findOneResult2.rows[0], 'object');
    test.equal(findOneResult2.rows.length, 1);
    test.equal(findOneResult2.rows[0].text, 'testing1');

    var result = testTasks.select().where('text = ?', 'testing1').wrapFetch(null, null);
    var result2 = testTasks.select().where('text = ?', 'testing1').limit(3).wrapFetch(null, null);
    var result3 = testTasks.select().where('text = ?', 'testing1').limit(3).offset(2).wrapFetch(null, null);

    test.equal(typeof result.rows, 'object');
    test.equal(result.rows.length, 6);
    _.each(result.rows, function(item) {
      test.equal(item.text, 'testing1');
    });
    onComplete();
  });

  //Shoudl throw error for the test failed case
  Tinytest.addAsync('activerecord - basic - failure', function(test, onComplete) {
    // create already existed throw error
    test.throws(function() {
      testTasks.createTable(testTasks).wrapSave(null, null);
    });
    // throw error is schema different
    test.throws(function() {
      testTasks.insert({ text: 'failure', username: 'eric'}).wrapSave(null, null);
    });
    // Should not throw error if drop an unexisted table
    try {
      var expectedError;
      testTasks.dropTable('notExistedTable').wrapSave(null, null);
    } catch(error) {
      expectedError = error;
    }
    test.isTrue(!expectedError);

    testTasks.dropTable().wrapSave(null, null);

    // recreate a complex table for test
    var testTasksTable = {
      text: ['$string', '$notnull'],
      tasknumber: ['$number', {$default: '0'}]
    };
    testTasks.createTable(testTasksTable).wrapSave(null, null);
    testTasks.insert( {text: 'testing1'} ).wrapSave(null, null);
    testTasks.insert( {text: 'testing2', tasknumber: 2}).wrapSave(null, null);
    onComplete();
  });

}


// // Connection test, should be added after the default connect string removed
Meteor.isServer && Tinytest.add('activerecord - connection failure',
  function(test) {

  }
)