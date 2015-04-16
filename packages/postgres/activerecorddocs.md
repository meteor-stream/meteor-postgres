### GENERAL USE

There are four types of methods in this ORM. <br/>
1. Statements may be chained. You must use one (and only one) starter per chain. <br/>
2. Cabooses may only be added to the end of statement chains.  <br/>
3. Queries override all other chains and should only be used by themselves. <br/> 
4. Data methods should be used in all cases to save or retrieve your data.  <br/>

Note: There is no alter table function as you cannot alter tables after data has been entered. It is recommended that <br/>
you drop the table and re-create it.  <br/>

### CREATE TABLE QUERY
**Parameters:** tableObj (req) <br/>
**SQL:** CREATE TABLE field data type constraint <br/>
**Special:** Function is required for all SQL collections, primary key added unless _id field is supplied <br/>

**Example:** 
`ActiveRecord.createTable('students', {` <br/>
  `name: ['$string', '$notnull'],` <br/>
  `age: ['$number'],` <br/>
  `class: ['$string', {$default: '2015'}]` <br/>
`});` <br/>

`CREATE TABLE students(id serial primary key not null, name varchar(255) not null, age integer, <br/> 
  class varchar(255) default 2015);` <br/>

**Data types available:**
  $number: 'integer',
  $string: 'varchar(255)',
  $json: 'json',
  $datetime: 'date',
  $float: 'decimal',
  $seq: 'serial',
  $bool: 'boolean'
  
**Table constraints available:**
    $unique: 'unique',
    $check: 'check ', // value
    $exclude: 'exclude',
    $notnull: 'not null',
    $default: 'default ', // value
    $primary: 'primary key'

### DROP TABLE QUERY
**Parameters:** none <br/>
**SQL:** DROP TABLE table  <br/>
**Special:** Deletes cascade  <br/>

### SELECT STATEMENT STARTER
**Parameters:** fields (arguments, optional) <br/>
**SQL:** SELECT fields FROM table, SELECT * FROM table <br/>
**Special:** May pass table, distinct, field to obtain a single record per unique value  <br/>

### FIND ONE STATEMENT STARTER
// Parameters: id (optional)
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

### PARTIALLY COMPLETE: INSERT QUERY
// Parameters: inserts object (req) 
// SQL: INSERT INTO table (fields) VALUES (values)
// Special:
ActiveRecord.prototype.insert = function() {};

### PARTIALLY COMPLETE: UPDATE STATEMENT STARTER
// Parameters: updates object (req)
// SQL: UPDATE table SET (fields) = (values)
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
// Parameters: limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id ASC LIMIT 1, SELECT * FROM table ORDER BY table._id ASC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.first = function(table, limit) {};

### LAST QUERY
// Parameters: limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id DESC LIMIT 1, SELECT * FROM table ORDER BY table._id DESC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.last = function(table, limit) {};

### TAKE QUERY
// Parameters: limit (optional, defaults to 1)
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


    

### SAVE DATA 



