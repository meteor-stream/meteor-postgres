Tinytest.add(
  'SQLcollection - call SQLCollection without new',
  function (test) {
    test.throws(
      function () {
        SQLCollection(null);
      },
      /Use new to construct a SQLCollection/
    );

    /**
    * This part is going to handle the input of SQLCollection()
    */
    test.throws(
      function() {
        var test1 = new SQLCollection();
      },
      /First argument to new SQLCollection must be a string or null/
    );
  }
);

Tinytest.add('Livedata - server method - tests', function (test) {
  var testCollection = new SQLCollection('test');
  //no event name error handle
});