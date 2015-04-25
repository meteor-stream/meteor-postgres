Tinytest.add(
  'SQL.collection - SQL.Collection instantiation',
  function (test) {
    test.throws(
      function () {
        SQL.Collection(null);
      },
      /Use new to construct a SQLCollection/
    );

    test.throws(
      function() {
        var test1 = new SQL.Collection();
      },
      /First argument to new SQLCollection must exist/
    );

    test.throws(
      function() {
        var test2 = new SQL.Collection(1234);
      },
      /First argument to new SQLCollection must be a string or null/
    );

  }
);

Tinytest.add('Livedata - server method - tests', function (test) {
  // var testCollection = new SQL.Collection('test');
  //no event name error handle
});