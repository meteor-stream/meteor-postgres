// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

ActiveRecord = function() {
  this.conString = conString;
  this.inpustString = '';
  this.table = '';
  this.selectString = '';
  this.joinString = '';
  this.whereString = '';
  this.caboose = '';
};

// TODO: COMPLETE
// Parameters: table (req), fields (arguments, optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: May pass table, distinct, field to obtain a single record per unique value
ActiveRecord.prototype.select = function(table /*arguments*/) {
  this.table = table;
  var args = '';
  if (arguments.length >= 2) {
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i] === 'distinct') {
        args += 'DISTINCT ';
      } else {
        args += arguments[i] + ', ';
      }
    }
    args = args.substring(0,args.length-2);
  } else {
    args += '*';
  }
  this.selectString = 'SELECT ' + args + ' FROM ' + table;
  return this;
};

// TODO: INCOMPLETE
// can accept string
ActiveRecord.prototype.joins = function() {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    var joinTable = arguments[0];
    this.joinString += ' INNER JOIN ' + joinTable + ' ON '+ joinTable + '._id = ' + this.table + '.' + joinTable + '_id';
  }
  return this;
};

// TODO: IN PROGRESS
// Parameters:
// SQL: WHERE field operator comparator, WHERE field1 operator1 comparator1 AND/OR field2 operator2 comparator2
// Special:
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

// TODO: INCOMPLETE
// Parameters: table (req)
// SQL: INSERT INTO table
// Special:
ActiveRecord.prototype.insert = function() {};

// TODO: INCOMPLETE
// Parameters: table (req)
// SQL: UPDATE table SET
// Special:
ActiveRecord.prototype.update = function() {};

// TODO: COMPLETE
// Parameters: table (req)
// SQL: DELETE FROM table
// Special: May be chained with where, otherwise will delete all rows from table
ActiveRecord.prototype.delete = function(table) {
  this.selectString = 'DELETE FROM ' + table;
  return this;
};

// TODO: COMPLETE
// Parameters: limit integer
// SQL: LIMIT number
ActiveRecord.prototype.limit = function(limit) {
  this.caboose += ' LIMIT ' + limit;
  return this;
};

// TODO: COMPLETE
// Parameters: offset integer
// SQL: OFFSET number
ActiveRecord.prototype.offset = function(offset) {
  this.caboose += ' OFFSET ' + offset;
  return this;
};

// TODO: COMPLETE
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id ASC LIMIT 1, SELECT * FROM table ORDER BY table._id ASC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.first = function(table, limit) {
  this.table = table;
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + table + ' ORDER BY ' + table + '._id ASC LIMIT ' + limit + ';';
  return this;
};

// TODO: COMPLETE
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id DESC LIMIT 1, SELECT * FROM table ORDER BY table._id DESC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.last = function(table, limit) {
  this.table = table;
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + table + ' ORDER BY ' + table + '._id DESC LIMIT ' + limit + ';';
  return this;
};

// TODO: COMPLETE
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table LIMIT 1, SELECT * FROM table LIMIT limit
// Special: Retrieves a record without ordering, overrides all other chainable functions
ActiveRecord.prototype.take = function(table, limit) {
  this.table = table;
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + table + ' LIMIT ' + limit + ';';
  return this;
};

// TODO: INCOMPLETE
// Parameters:
// SQL: GROUP BY
// Special:
ActiveRecord.prototype.group = function() {
  //this.caboose +=
  return this;
};

// TODO: INCOMPLETE
// Parameters:
// SQL: HAVING
// Special:
ActiveRecord.prototype.having = function() {
  //this.caboose +=
  return this;
};

// TODO: COMPLETE
// Parameters: None
// SQL: Combines previously chained items to create a SQL statement
// Special: Functions with an inputString override other chainable functions because they are complete
ActiveRecord.prototype.fetch = function() {
  var table = this.table;
  var input = this.inpustString.length > 0 ? this.inpustString : this.selectString + this.joinString + this.whereString + this.caboose + ';';
  console.log('Fetch input:', input);
  pg.connect(this.conString, function(err, client, done) {
    if (err){
      console.log(err);
    }
    //console.log(input);
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
