var MiniSqlStub = function(name) {
  var stub = miniSQL();
  stub.table = name;
  stub.conString = 'postgres://postgres:1234@localhost/postgres';
  stub.wrapSave = Meteor.wrapAsync(stub.save.bind(stub));
  stub.wrapFetch = Meteor.wrapAsync(stub.fetch.bind(stub));
  return stub;
};

Tinytest.add('miniSQL - test - basic', function(test) {
  //TODO
});