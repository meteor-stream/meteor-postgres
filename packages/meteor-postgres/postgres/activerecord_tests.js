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

    //select
    var result = testTasks.select().where('text = ?', 'testing1').wrapFetch(null, null);
    //select + limit
    var result2 = testTasks.select().where('text = ?', 'testing1').limit(3).wrapFetch(null, null);
    //select + limit + offset
    var result3 = testTasks.select().where('text = ?', 'testing1').limit(3).offset(2).wrapFetch(null, null);
    //select + offset
    var result4 = testTasks.select().where('text = ?', 'testing1').offset(2).wrapFetch(null, null);
    var result5 = testTasks.select().where('text = ?', 'testing1').offset(6).wrapFetch(null, null);
    var result6 = testTasks.select().where('text = ?', 'testing1').offset(8).wrapFetch(null, null);
    //order default and DESC/ASC
    var result7 = testTasks.select().order('text').wrapFetch(null, null);
    var result8 = testTasks.select().order('text ASC').wrapFetch(null, null);
    var result9 = testTasks.select().order('text DESC').wrapFetch(null, null);
    //chaining order
    var result10 = testTasks.select().where('text = ?', 'testing1').order('id DESC').offset(2).limit(3).wrapFetch(null, null);
    var result11 = testTasks.select().where('text = ?', 'testing1').offset(2).order('id DESC').limit(3).wrapFetch(null, null);

    test.equal(typeof result.rows, 'object');
    test.equal(result.rows.length, 6);
    _.each(result.rows, function(item) {
      test.equal(item.text, 'testing1');
    });
    test.equal(result2.rows.length, 3);
    _.each(result2.rows, function(item) {
      test.equal(item.text, 'testing1');
    });
    test.equal(result3.rows.length, 3);
    _.each(result3.rows, function(item) {
      test.equal(item.text, 'testing1');
    });
    test.equal(result4.rows.length, 4);
    _.each(result4.rows, function(item) {
      test.equal(item.text, 'testing1');
    });
    test.equal(result5.rows.length, 0);
    test.equal(result6.rows.length, 0);
    test.equal(result7.rows, result8.rows);
    test.equal(result7.rows[7], result9.rows[0]);
    test.equal(result10.rows, result11.rows);

    // Non-overreiden first, last, take
    var result1 = testTasks.select().offset(2).where('text = ?', 'testing1').order('id DESC').limit(3).first().wrapFetch(null, null);
    var result2 = testTasks.select().first(2).wrapFetch(null, null);

    test.equal(result1.rows[0], result2.rows[0]);
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
    //findOne can only find id
    test.throws(function() {
      testTasks.findOne('testing1').wrapFetch(null, null);
    });

    // recreate a complex table for test
    testTasks.dropTable().wrapSave(null, null);
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