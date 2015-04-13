// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

ActiveRecord = function() {
  this.inputString = '';
  this.selectString = '';
  this.joinString = '';
  this.whereString = '';
  this.caboose = '';
  this.table = '';
};

// Accepts table and following arguments are fields
// SELECT fields FROM table
// TODO distinct
ActiveRecord.prototype.select = function(table /*arguments*/) {
  this.table = table;
  var args = '';
  if (arguments.length > 2) {
    args += '(';
    for (var i = 1; i < arguments.length; i++) {
      args += arguments[i] + ',';
    }
    var last = args.length-1;
    args = args.slice(0,last) + ')';
  } else {
    args += arguments[1];
  }

  //args = args.join(',');
  this.selectString = 'SELECT ' + args + ' FROM ' + table;
  return this;
};



// can accept string
ActiveRecord.prototype.joins = function() {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    var joinTable = arguments[0];
    this.joinString += ' INNER JOIN ' + joinTable + ' ON '+ joinTable + '._id = ' + this.table + '.' + joinTable + '_id';
  }

  return this;
};


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
  this.whereString += ' WHERE ';
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    // raw
    this.whereString += arguments[0];
  } else if (arguments.length === 2 && Array.isArray(arguments[1])) {
    // Arg[0] is string with ? and Arg[1] is array of items to replace the ?
    var redux = arguments[0].replace('?', arguments[1]);
    //this.inputString
  }
  this.whereString += ' ';
  return this;
};

ActiveRecord.prototype.limit = function(limit) {
  this.caboose += ' LIMIT ' + limit;
  return this;
};

ActiveRecord.prototype.offset = function(offset) {
  this.caboose += ' OFFSET ' + offset;
  return this;
};

// TODO HOWTO must use fetch to communicate with the database it is the last item in the chain
ActiveRecord.prototype.fetch = function() {
  var input = this.selectString + this.joinString + this.whereString + this.caboose + ';';
  var table = this.table;
  console.log(input);
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







//// TODO HO
//// TODO HOWTO find, take, first, last are SELECT statements - > pick only one
//// If passed a single integer, returns the item with that _id
//// SELECT * FROM table WHERE (table._id = value) LIMIT 1;
//// If passed an array of primary keys, it will return records for those keys
//// SELECT * FROM table WHERE (table._id IN (array elements)); --> Ruby returns record not found unless all items are found
//ActiveRecord.prototype.find = function(table, args) {
//  this.table = table;
//  this.inputString += 'SELECT * FROM ' + this.table + ' ';
//  this.whereString += 'WHERE ('+ this.table + '._id ';
//  if (typeof args === 'number') {
//    this.whereString += '= ' + args + ')';
//    this.caboose += 'LIMIT 1;';
//  } else if (Array.isArray(args)) {
//    this.inputString += 'IN (' + args.join(',') + '));';
//  }
//  this.inputString += ' ';
//  return this;
//};
//
//// Retrieves a record without ordering
//// If passed no arguments, returns a record
//// SELECT * FROM table LIMIT 1;
//// passing other numbers changes the LIMIT
//// Ruby returns null if no record found
//ActiveRecord.prototype.take = function(table, args) {
//  this.table = table;
//  args = args || 1;
//  this.inputString += 'SELECT * FROM ' + table + ' LIMIT ' + args + ' ';
//  return this;
//};
//
//// Retrieves first item
//// If no arguments passed, returns first in order of primary key
//// passing other numbers changes the LIMIT
//ActiveRecord.prototype.first = function(table, args) {
//  this.table = table;
//  args = args || 1;
//  this.inputString += 'SELECT * FROM ' + table + ' ORDER BY ' + table + '._id ASC LIMIT ' + args + ' ';
//  return this;
//};
//
//// Retrieves last item
//// If no arguments passed, returns last in order of primary key
//// passing other numbers changes the LIMIT
//ActiveRecord.prototype.last = function(table, args) {
//  this.table = table;
//  args = args || 1;
//  this.inputString += 'SELECT * FROM ' + table + ' ORDER BY ' + table + '._id DESC LIMIT ' + args + ' ';
//  return this;
//};
//
//// Finds first record matching same condition
//// TODO: find_by is similar to .where -> do where first
//ActiveRecord.prototype.find_by = function() {
//
//};
//
//// TODO: BATCHES??
//

