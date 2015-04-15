Tinytest.add(
  'SQL.collection - call SQL.Collection without new',
  function (test) {
    test.throws(
      function () {
        SQL.Collection(null);
      },
      /Use new to construct a SQLCollection/
    );

    /**
    * This part is going to handle the input of SQLCollection()
    */
    test.throws(
      function() {
        var test1 = new SQL.Collection();
      },
      /First argument to new SQL.Collection must be a string or null/
    );
  }
);

Tinytest.add('Livedata - server method - tests', function (test) {
  var testCollection = new SQL.Collection('test');
  //no event name error handle
});