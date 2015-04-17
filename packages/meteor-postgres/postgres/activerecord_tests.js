// Currently all the tests based on ActiveRecord are running synchronously
var wrapAsyncHelper = function(activeRecord) {
  activeRecord.prototype.wrapFetch = Meteor.wrapAsync(activeRecord.fetch.bind(activeRecord));
  activeRecord.prototype.wrapSave = Meteor.wrapAsync(activeRecord.save.bind(activeRecord));
};

var testTasksTable = {
  text: ['$string', '$notnull']
};

var testUserTable = {
  username: ['$string', '$notnull']
};

if (Meteor.isServer) {
  var testTasks = new ActiveRecord('testTasks');
  wrapAsyncHelper(testTasks);
  testTasks.dropTable().wrapSave();
  testTasks.createTable(testTasksTable).wrapSave();
  testTasks.insert({ text: 'testing1' }).wrapSave();
  testTasks.insert({ text: 'testing2' }).wrapSave();
  testTasks.insert({ text: 'testing3' }).wrapSave();
  for ( var i = 0; i < 5; i++) {
    testTasks.insert({ text: 'testing1' }).wrapSave();
  }
}

Tinytest.add('activerecord - instantiate failure', function(test) {
  test.throws(
    function () {
      ActiveRecord(null, null);
    },
    /Use new to construct an ActiveRecord/
  );
});

Tinytest.add('activerecord - basic - success', function(test) {
  var testVal = testTasks.findOne().wrapFetch();
  test.equal(typeof testVal.rows[0], 'object');
  test.equal(testVal.rows.length, 1);
});

Tinytest.add('activerecord - basic - failure', function(test) {

  test.throws(function() {
    testTasks.createTable(testTasks).wrapSave();
  });

  test.throws(function() {
    testTasks.insert({ text: 'failure1', username: 'eric'}).wrapSave();
  });

})
// Connection test, should be added after the default connect string removed
Meteor.isServer && Tinytest.add('activerecord - connection failure',
  function(test) {

  }
)