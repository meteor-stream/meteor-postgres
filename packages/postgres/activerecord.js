// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

ActiveRecord = function() {
  this.inputString = '';
};

// TODO HO
// TODO HOWTO find, take, first, last are SELECT statements - > pick only one
// If passed a single integer, returns the item with that _id
// SELECT * FROM table WHERE (table._id = value) LIMIT 1;
// If passed an array of primary keys, it will return records for those keys
// SELECT * FROM table WHERE (table._id IN (array elements)); --> Ruby returns record not found unless all items are found
ActiveRecord.prototype.find = function(table, args) {
  this.table = table;
  this.inputString += 'SELECT * FROM ' + this.table + ' WHERE ('+ this.table + '._id ';
  if (typeof args === 'number') {
    this.inputString += '= ' + args + ') LIMIT 1;'
  } else if (Array.isArray(args)) {
    this.inputString += 'IN (' + args.join(',') + '));';
  }
  return this;
};

// Retrieves a record without ordering
// If passed no arguments, returns a record
// SELECT * FROM table LIMIT 1;
// passing other numbers changes the LIMIT
// Ruby returns null if no record found
ActiveRecord.prototype.take = function(table, args) {
  this.table = table;
  args = args || 1;
  this.inputString += 'SELECT * FROM ' + table + ' LIMIT ' + args;
  return this;
};

// Retrieves first item
// If no arguments passed, returns first in order of primary key
// passing other numbers changes the LIMIT
ActiveRecord.prototype.first = function(table, args) {
  this.table = table;
  args = args || 1;
  this.inputString += 'SELECT * FROM ' + table + 'ORDER BY ' + table + '._id ASC LIMIT ' + args;
  return this;
};

// Retrieves last item
// If no arguments passed, returns last in order of primary key
// passing other numbers changes the LIMIT
ActiveRecord.prototype.last = function(table, args) {
  this.table = table;
  args = args || 1;
  this.inputString += 'SELECT * FROM ' + table + 'ORDER BY ' + table + '._id DESC LIMIT ' + args;
  return this;
};

// Finds first record matching same condition
// TODO: find_by is similar to .where -> do where first 
ActiveRecord.prototype.find_by = function() {

};

// TODO: BATCHES??

// Conditions can be strings, arrays, or hashes
// RAW is a string, arrays and hashes are safe
// WHERE field operator condition
// If an array is passed, the first argument is a string with ? that need to be replaced with the following elements
// Or you can pass the first element as a string with hash keys instead of ? and pass a hash as second element
// Alternatively, if the items are passed as separate arguments they will be treated as if in an array
// Can also be passed an object where fields are keys and values are values
// If value is array, it is an IN statement
// TODO: Supports ranges
ActiveRecord.prototype.where = function(/*Arguments*/) {
  //this.inputString += 'WHERE ';
  //var args;
  //
  //
  //
  //
  //if (typeof arg1 === 'string' && !arg2) {
  //  this.inputString += arg1 + ';';
  //}
  //console.log(this.inputString);
  //return this;
};


// TODO HOWTO must use fetch to communicate with the database it is the last item in the chain
ActiveRecord.prototype.fetch = function() {
  var input = this.inputString;
  var table = this.table;
  pg.connect(conString, function(err, client, done) {
    if (err){
      console.log(err);
    }
    console.log(input);
    client.query(input, function(error, results) {
      if (error) {
        console.log("error in active record " + table, error);
      } else {
        console.log("results in active record " + table, results.rows);
      }
      done();
    });
  });
};