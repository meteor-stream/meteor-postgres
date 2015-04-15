Statements may be chained. Do not use more than one starter per query.
Cabooses must be attached to statements. 
Queries will override all other items in the chain.
Data functions must be attached to interact with the database. 

### SELECT STATEMENT STARTER
// Parameters: table (req), fields (arguments, optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: May pass table, distinct, field to obtain a single record per unique value
ActiveRecord.prototype.select = function(table /*arguments*/) {};

### FIND ONE STATEMENT STARTER
// Parameters: table (req), id (optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: If no idea is passed, may be chained with a where function
ActiveRecord.prototype.findOne = function (table /*arguments*/) {};

### INCOMPLETE: JOINS STATEMENT
// can accept string
ActiveRecord.prototype.joins = function() {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {};

### PARTIALLY COMPLETE: WHERE STATEMENT
// Parameters: 1) string only (not safe), 2) array (where first element is a string), 3) unlimited with first argument as string
// SQL: WHERE field operator comparator, WHERE field1 operator1 comparator1 AND/OR field2 operator2 comparator2
// Special:
// For example:
// db.select('students').where('age = ? and class = ? or name = ?','18','senior','kate').fetch();
// db.select('students').where(['age = ? and class = ? or name = ?','18','senior','kate']).fetch();
// db.select('students').where('age = 18 and class = senior or name = kate').fetch();
ActiveRecord.prototype.where = function(/*Arguments*/) {};

### INCOMPLETE: INSERT QUERY
// Parameters: table (req)
// SQL: INSERT INTO table
// Special:
ActiveRecord.prototype.insert = function() {};

### INCOMPLETE: UPDATE STATEMENT STARTER
// Parameters: table (req)
// SQL: UPDATE table SET
// Special:
ActiveRecord.prototype.update = function() {};

### REMOVE STATEMENT STARTER
// Parameters: table (req)
// SQL: DELETE FROM table
// Special: May be chained with where, otherwise will delete all rows from table
ActiveRecord.prototype.remove = function(table) {};

### LIMIT CABOOSE
// Parameters: limit integer
// SQL: LIMIT number
ActiveRecord.prototype.limit = function(limit) {};

### OFFSET CABOOSE
// Parameters: offset integer
// SQL: OFFSET number
ActiveRecord.prototype.offset = function(offset) {};

### FIRST QUERY
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id ASC LIMIT 1, SELECT * FROM table ORDER BY table._id ASC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.first = function(table, limit) {};

### LAST QUERY
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id DESC LIMIT 1, SELECT * FROM table ORDER BY table._id DESC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.last = function(table, limit) {};

### TAKE QUERY
// Parameters: table (req), limit (optional, defaults to 1)
// SQL: SELECT * FROM table LIMIT 1, SELECT * FROM table LIMIT limit
// Special: Retrieves a record without ordering, overrides all other chainable functions
ActiveRecord.prototype.take = function(table, limit) {};

### INCOMPLETE: GROUP CABOOSE
// Parameters:
// SQL: GROUP BY
// Special:
ActiveRecord.prototype.group = function() {};

### INCOMPLETE: HAVING CABOOSE
// Parameters:
// SQL: HAVING
// Special:
ActiveRecord.prototype.having = function() {};

### FETCH DATA  
// Parameters: None
// SQL: Combines previously chained items to create a SQL statement
// Special: Functions with an inputString override other chainable functions because they are complete
ActiveRecord.prototype.fetch = function() {};

### CREATE TABLE QUERY
// TODO: CREATE TABLE EXAMPLES. The first element in the array must be the data type from the _DataType object above
//ActiveRecord.createTable('students', {
//  name: ['$string', '$notnull'],
//  age: ['$number'],
//  class: ['$string', {$default: '2015'}]
//});
//CREATE TABLE students(id serial primary key not null, name varchar(255) not null, age integer, class varchar(255) default 2015,

//Postgres.createTable('students', {
//  name: ['$string', '$notnull'],
//  age: ['$number'],
//  class: ['$string', {$default: '2015'}],
//  _id: ['$number', '$notnull', '$primary', '$unique']
//});
//CREATE TABLE students (name varchar(255) not null, age integer, class varchar(255) default 2015, _id integer not null primary unique,

### SAVE DATA 

// TODO: PARTIALLY COMPLETE, NEEDS TESTING
// Parameters: table (req)
// SQL: DROP TABLE table
// Special: Deletes cascade
ActiveRecord.prototype.dropTable = function(table) {

