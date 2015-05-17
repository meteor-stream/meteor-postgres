// Currently all the tests based on ActiveRecord are running synchronously
// Making test Stub using decorator
var ActiveRecordStub = function(name) {
  var stub = serverSQL();
  stub.table = name;
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
  username: ['$string', '$notnull'],
  age: ['$number']
};

if (Meteor.isServer) {
  var testTasks = ActiveRecordStub('testTasks');
  testTasks.dropTable().wrapSave(null, null);
  testTasks.createTable(testTasksTable).wrapSave(null, null);
  testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing2' }).wrapSave(null, null);
  testTasks.insert({ text: 'testing3' }).wrapSave(null, null);
  for (var i = 0; i < 5; i++) {
    testTasks.insert({ text: 'testing1' }).wrapSave(null, null);
  }

  var testUser = ActiveRecordStub('testUser');
  testUser.dropTable().wrapSave(null, null);
  testUser.createTable(testUserTable).wrapSave(null, null);
  for (var i = 0; i < 3; i++) {
    testUser.insert({ username: 'eddie' + i, age: 2 * i }).wrapSave(null, null);
    testUser.insert({ username: 'paulo', age: 27}).wrapSave(null, null);
  }

  //Should test the operation defined in the serverSQL and return result successfully
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

    var result12 = testTasks.select().where('text = ?', ['testing1', 'testing2']).wrapFetch(null, null);
    var result13 = testTasks.select().where('text = ?', ['testing1']).wrapFetch(null, null);
    var result14 = testTasks.select().where('id = ? AND text = ?', 2, 'testing1').wrapFetch(null, null);
    var result15 = testTasks.select().where('id = ? AND text = ?', [1, 2, 3], ['testing1', 'testing2']).wrapFetch(null, null);
    test.equal(result12.rows.length, 7);
    test.equal(result12.rows[1].text, 'testing2');
    test.equal(result13.rows, result.rows);
    test.equal(result14.rows.length, 0);
    test.equal(result15.rows.length, 2);
    test.equal(result15.rows[0].id, 1);
    test.equal(result15.rows[1].id, 2);
    test.equal(result15.rows[0].text, 'testing1');
    test.equal(result15.rows[1].text, 'testing2');
    // Non-overreiden first, last, take
    var result1 = testTasks.select().offset(2).where('text = ?', 'testing1').order('id DESC').limit(3).first().wrapFetch(null, null);
    var result2 = testTasks.select().first(2).wrapFetch(null, null);
    var result3 = testTasks.select().last(4).wrapFetch(null, null);
    var result4 = testTasks.select().offset(2).where('text = ?', 'testing1').order('id DESC').limit(3).last().wrapFetch(null, null);
    var result5 = testTasks.select().offset(2).order('id DESC').limit(3).take().wrapFetch(null, null);
    var result6 = testTasks.select().take().wrapSave(null, null);
    //should consider chainging order for first, last, take?
    test.equal(result1.rows[0], result2.rows[0]);
    test.equal(result3.rows[0], result4.rows[0]);
    test.equal(result3.rows[1].id, 7);
    test.equal(result5.rows, result6.rows);

    //update and remove
    // update coverage should take another args, currently just 1 arg
    // should better add the rule that forbid changes in id?
    var origin = testTasks.select().where('text = ?', 'testing1').wrapSave(null, null);
    testTasks.update({ text: 'testing1' }).where('text = ?', 'testing2').wrapSave(null, null);
    var result1 = testTasks.select().where('text = ?', 'testing1').wrapFetch(null, null);
    test.equal(origin.rows.length + 1, result1.rows.length);
    testTasks.update( {text: 'testing3'} ).wrapSave(null, null);
    var result2 = testTasks.select().where('text = ?', 'testing1').wrapFetch(null, null);
    var result3 = testTasks.select().where('text = ?', 'testing3').wrapFetch(null, null);
    test.equal(result2.rows.length, 0);
    test.equal(result3.rows.length, 8);

    testTasks.where('id = ?', '2').remove().wrapSave(null, null);
    var result1 = testTasks.select().wrapFetch(null, null);
    test.equal(result1.rows.length, 7);
    testTasks.remove().wrapSave(null, null);
    var result2 = testTasks.select().wrapFetch(null, null);
    test.equal(result2.rows.length, 0);

    // branch coverage TODO
    // select args not empty branch
      // not empty and no distinct
    // var result1 = testUser.select('testUser.username', 'testUser.age').
      // not empty and has distinct

    // update args > 1 branch
    testUser.update({username: 'PaulOS', age: 100}).where('username = ?', 'notexist').wrapSave(null, null);
    var result1 = testUser.select().where('username = ?', 'PaulOS').wrapFetch(null, null);
    test.equal(result1.rows.length, 0);

    testUser.update({username: 'PaulOS', age: 100}).where('username = ?', 'paulo').wrapSave(null, null);
    var result2 = testUser.select().where('username = ?', 'PaulOS').wrapFetch(null, null);
    test.equal(result2.rows.length, 3);
    _.each(result2.rows, function(item) {
      test.equal(item.username, 'PaulOS');
      test.equal(item.age, 100);
    });

    onComplete();
  });

  //Should throw error for the test failed case
  Tinytest.addAsync('activerecord - basic - failure', function(test, onComplete) {
    // create already existed throw error
    test.throws(function() {
      testTasks.createTable(testTasks).wrapSave(null, null);
    });
    // throw error is schema different
    test.throws(function() {
      testTasks.insert({ text: 'failure', username: 'eric'}).wrapSave(null, null);
    });
    //update error
    test.throws(function() {
      testTasks.update( {username: 'kate'} ).where('text = ?', 'testing3').wrapSave(null, null);
    });

    // How should update behavior for non-existed where?
    // test.throws(function() {
    //   testTasks.update( {text: 'testing2'} ).where('text = ?', 'testing2').wrapSave(null, null);
    // });
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

    //Clear the table after use
    testTasks.dropTable().wrapSave(null, null);
    testUser.dropTable().wrapSave(null, null);
    onComplete();
  });

  //Complex table
  // Todo: createRelationShip
  //       Join table test
  var testTree = ActiveRecordStub('testTree');
  var testLocation = ActiveRecordStub('testLocation');
  var testSpecies = ActiveRecordStub('testSpecies');

  var testTreeTable = {
    id: ['$number', '$notnull'],
    treename: ['$string', '$notnull'],
    locationid: ['$number', '$notnull'],
    speciesid: ['$number', '$notnull']
  };

  var testLocationTable = {
    id: ['$number', '$notnull'],
    longitude: ['$float', '$notnull'],
    latitude: ['$float', '$notnull']
  };

  var testSpeciesTable = {
    id: ['$number', '$notnull'],
    species: ['$string', '$notnull']
  };

  testTree.dropTable().wrapSave(null, null);
  testLocation.dropTable().wrapSave(null, null);
  testSpecies.dropTable().wrapSave(null, null);

  var testTree = ActiveRecordStub('testTree');
  var testLocation = ActiveRecordStub('testLocationTable');
  var testSpecies = ActiveRecordStub('testSpeciesTable');

  Tinytest.addAsync('activerecord - advanced - success', function(test, onComplete) {
    testTree.dropTable().wrapSave(null, null);
    testLocation.dropTable().wrapSave(null, null);
    testSpecies.dropTable().wrapSave(null, null);
    onComplete();
  });
}

// Connection test, should be added after the default connect string removed
Meteor.isServer && Tinytest.add('activerecord - connection failure',
  function(test) {

  }
);

