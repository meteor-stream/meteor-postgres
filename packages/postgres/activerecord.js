// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

ActiveRecord = function() {
  this.conString = conString;
  this.inputString = '';
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

// TODO: COMPLETE
// Parameters: table (req), id (optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: If no idea is passed, may be chained with a where function
ActiveRecord.prototype.findOne = function (table /*arguments*/) {
  if (arguments.length === 2) {
    this.inputString = 'SELECT * FROM ' + table + ' WHERE ' + table + '._id = ' + args + ' LIMIT 1;';
  } else {
    this.selectString = 'SELECT * FROM ' + table;
    this.caboose = ' LIMIT 1';
  }
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
// Parameters: string only, array (where first element is a string), unlimited with first argument as string
// SQL: WHERE field operator comparator, WHERE field1 operator1 comparator1 AND/OR field2 operator2 comparator2
// Special:
// Conditions can be strings, arrays, or hashes
// RAW is a string, arrays and hashes are safe
// If an array is passed, the first argument is a string with ? that need to be replaced with the following elements
// Or you can pass the first element as a string with hash keys instead of ? and pass a hash as second element
// Alternatively, if the items are passed as separate arguments they will be treated as if in an array
// Can also be passed an object where fields are keys and values are values
// If value is array, it is an IN statement
// TODO: THESE WORK
// db.select('students').where('age = ? and class = ? or name = ?','18','senior','kate').fetch();
// db.select('students').where(['age = ? and class = ? or name = ?','18','senior','kate']).fetch();
// db.select('students').where('age = 18 and class = senior or name = kate').fetch();
// TODO: Supports ranges
ActiveRecord.prototype.where = function(/*Arguments*/) {
  this.whereString += ' WHERE ';
  var where = '', redux, substring1, substring2, thisKey;
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    // 1 arg, string -> raw
    this.whereString += arguments[0];
  } else if (arguments.length === 1 && Array.isArray(arguments[0])) {
    // 1 arg, array -> first is string, then replacements
    where += arguments[0][0];
    // replace ? with rest of array
    for (var i = 1, count = arguments[0].length; i < count; i++) {
      redux = where.indexOf('?');
      substring1 = where.substring(0,redux);
      substring2 = where.substring(redux+1,where.length);
      where = substring1 + arguments[0][i] + substring2;
    }
    this.whereString += where;
  } else if (arguments.length === 2 && typeof arguments[1] === 'object') {
    //// 2 args, string, hash -> string with keys, replacements
    //where += arguments[0];
    //// replace keys with key, values from hash
    //for (var key in arguments[1]) {
    //  redux = where.indexOf(key);
    //  thisKey = key+'';
    //  substring1 = where.substring(0,redux);
    //  substring2 = where.substring(redux+1+thisKey.length,where.length);
    //  where = substring1 + arguments[i] + substring2;
    //}
    //this.whereString += where;
  } else {
    // more than 2 -> treated like an array
    where += arguments[0];
    // replace ? with rest of array
    for (var i = 1, count = arguments.length; i < count; i++) {
      redux = where.indexOf('?');
      substring1 = where.substring(0,redux);
      substring2 = where.substring(redux+1,where.length);
      where = substring1 + arguments[i] + substring2;
    }
    this.whereString += where;
  }

  return this;
};

// TODO: Under consideration
ActiveRecord.prototype.where.not = function() {};
ActiveRecord.prototype.where.and = function() {};
ActiveRecord.prototype.where.or = function() {};

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
  console.log(this.inputString, 123423948098239488888888888888888888888888888888);
  var input = this.inputString.length > 0 ? this.inputString : this.selectString + this.joinString + this.whereString + this.caboose + ';';
  console.log('Fetch input:', input);
  //pg.connect(this.conString, function(err, client, done) {
  //  if (err){
  //    console.log(err);
  //  }
  //  //console.log(input);
  //  client.query(input, function(error, results) {
  //    if (error) {
  //      console.log("error in active record " + table, error);
  //    } else {
  //      console.log("results in active record " + table, results.rows);
  //    }
  //    done();
  //  });
  //});
};
