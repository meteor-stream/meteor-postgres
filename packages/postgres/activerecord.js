// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';
//var table = 'tasks';

ActiveRecord = function (table, conString) {
  this.conString = conString || 'postgres://postgres:1234@localhost/postgres';
  this.table = table || 'tasks';
  // inputString used by queries, overrides other strings
  this.inputString = '';
  // strings used by chaining statements
  this.selectString = '';
  this.updateString = '';
  this.dataArray = [];
  this.joinString = '';
  this.whereString = '';
  this.caboose = '';
  // passes previous function name into data functions for error logging
  this.prevFunc = '';
};

ActiveRecord.prototype._DataTypes = {
  $number: 'integer',
  $string: 'varchar(255)',
  $json: 'json',
  $datetime: 'date',
  $float: 'decimal',
  $seq: 'serial',
  $bool: 'boolean'
};

ActiveRecord.prototype._TableConstraints = {
  $unique: 'unique',
  $check: 'check ', // value
  $exclude: 'exclude',
  $notnull: 'not null',
  $default: 'default ', // value
  $primary: 'primary key'
};

// TODO: COMPLETE
// Parameters: table (req), tableObj (req), relTable (optional)
// SQL: CREATE TABLE
// Special:
ActiveRecord.prototype.createTable = function (tableObj) {
  console.log("in posgres create table");
  // SQL: 'CREATE TABLE table (fieldName constraint);'
  // initialize input string parts
  var table = this.table;
  var startString = 'CREATE TABLE ' + table + ' (';
  var item, subKey, valOperator, inputString = '';
  // iterate through array arguments to populate input string parts

  for (var key in tableObj) {
    inputString += key + ' ';
    inputString += this._DataTypes[tableObj[key][0]];
    if (Array.isArray(tableObj[key]) && tableObj[key].length > 1) {
      for (var i = 1, count = tableObj[key].length; i < count; i++) {
        item = tableObj[key][i];
        if (typeof item === 'object') {
          subKey = Object.keys(item);
          valOperator = this._TableConstraints[subKey];
          inputString += ' ' + valOperator + item[subKey];
        } else {
          inputString += ' ' + this._TableConstraints[item];
        }
      }
    }
    inputString += ', ';
  }
  // check to see if id provided
  if (inputString.indexOf('_id') === -1) {
    inputString += '_id serial primary key,';
  }

  //inputString += ');';
  // add notify functionality and close input string
  inputString = startString + inputString;
  inputString += " created_at TIMESTAMP default now()); " +
  "CREATE OR REPLACE FUNCTION notify_trigger_" + table + "() RETURNS trigger AS $$" +
  "BEGIN" +
  " IF (TG_OP = 'DELETE') THEN " +
  "PERFORM pg_notify('notify_trigger_" + table + "', '[{' || TG_TABLE_NAME || ':' || OLD._id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN old;" +
  "ELSIF (TG_OP = 'INSERT') THEN " +
  "PERFORM pg_notify('notify_trigger_" + table + "', '[{' || TG_TABLE_NAME || ':' || NEW._id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN new; " +
  "ELSIF (TG_OP = 'UPDATE') THEN " +
  "PERFORM pg_notify('notify_trigger_" + table + "', '[{' || TG_TABLE_NAME || ':' || NEW._id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN new; " +
  "END IF; " +
  "END; " +
  "$$ LANGUAGE plpgsql; " +
  "CREATE TRIGGER watched_table_trigger AFTER INSERT OR DELETE OR UPDATE ON " + table +
  " FOR EACH ROW EXECUTE PROCEDURE notify_trigger_" + table + "();";

  this.inputString = inputString;
  this.prevFunc = 'CREATE TABLE';
  return this;
};

// TODO: COMPLETE
// Parameters: none
// SQL: DROP TABLE table
// Special: Deletes cascade
ActiveRecord.prototype.dropTable = function () {
  this.inputString = 'DROP TABLE IF EXISTS ' + this.table + ' CASCADE; DROP FUNCTION IF EXISTS notify_trigger_' + this.table + '() CASCADE;';
  this.prevFunc = 'DROP TABLE';
  return this;
};

// TODO: COMPLETE
// Parameters: fields (arguments, optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: May pass table, distinct, field to obtain a single record per unique value
ActiveRecord.prototype.select = function (/*arguments*/) {
  var args = '';
  if (arguments.length >= 2) {
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i] === 'distinct') {
        args += 'DISTINCT ';
      } else {
        args += arguments[i] + ', ';
      }
    }
    args = args.substring(0, args.length - 2);
  } else {
    args += '*';
  }
  this.selectString = 'SELECT ' + args + ' FROM ' + this.table;
  this.prevFunc = 'SELECT';
  return this;
};

// TODO: COMPLETE
// Parameters: id (optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: If no idea is passed, may be chained with a where function
ActiveRecord.prototype.findOne = function (/*arguments*/) {
  if (arguments.length === 2) {
    this.inputString = 'SELECT * FROM ' + this.table + ' WHERE ' + this.table + '._id = ' + args + ' LIMIT 1;';
  } else {
    this.selectString = 'SELECT * FROM ' + this.table;
    this.caboose = ' LIMIT 1';
  }
  this.prevFunc = 'FINE ONE';
  return this;
};

// TODO: INCOMPLETE
// can accept string
ActiveRecord.prototype.joins = function () {
  if (arguments.length === 1 && typeof arguments[0] === 'string') {
    var joinTable = arguments[0];
    this.joinString += ' INNER JOIN ' + joinTable + ' ON ' + joinTable + '._id = ' + this.table + '.' + joinTable + '_id';
  }
  return this;
};

// TODO: PARTIALLY COMPLETE -> need to add IN statement if value is an array & additional selects & prevent use of words that are not SQL words
// Parameters: string with ?'s followed by an argument for each of the ?'s
// SQL: WHERE field operator comparator, WHERE field1 operator1 comparator1 AND/OR field2 operator2 comparator2
// Special:
// For example:
// db.select('students').where('age = ? and class = ? or name = ?','18','senior','kate').fetch();
ActiveRecord.prototype.where = function (/*Arguments*/) {
  this.dataArray = [];
  this.whereString += ' WHERE ';
  var where = '', redux, substring1, substring2;
  where += arguments[0];
  // replace ? with rest of array
  for (var i = 1, count = arguments.length; i < count; i++) {
    redux = where.indexOf('?');
    substring1 = where.substring(0, redux);
    substring2 = where.substring(redux + 1, where.length);
    where = substring1 + '$' + i + substring2;
    this.dataArray.push(arguments[i]);
  }
  this.whereString += where;
  return this;
};

// update tasks set text = 'test'
// where userid = (select _id from users1 where name = 'paulo');
// tasks.update({text: 'test'}).where(').save();
// tasks.update({text: 'test'}).where('userid = ? (select ? from ? where name = ?','18','senior','kate').fetch();
// db.select('students').where(['age = ? and class = ? or name = ?','18','senior','kate']).fetch();
// db.select('students').where('age = 18 and class = senior or name = kate').fetch();
ActiveRecord.prototype.parameterizedWhere = function() {

};


// TODO: COMPLETE
// Parameters: inserts object (req)
// SQL: INSERT INTO table (fields) VALUES (values)
// Special:
ActiveRecord.prototype.insert = function (inserts) {
  var valueString = ') VALUES (', keys = Object.keys(inserts);
  var insertString = 'INSERT INTO ' + this.table + ' (';
  this.dataArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length; i < count;) {
    insertString += keys[i] + ', ';
    this.dataArray.push(inserts[keys[i]]);
    valueString += '$' + (++i) + ', ';
  }
  this.inputString = insertString.substring(0, insertString.length - 2) + valueString.substring(0, valueString.length - 2) + ');';
  this.prevFunc = 'INSERT';
  return this;
};

// TODO: PARTIALLY COMPLETE, NEEDS TESTING
// Parameters: updates object (req)
// SQL: UPDATE table SET (fields) = (values)
// Special:
ActiveRecord.prototype.update = function (updates) {
  var updateField = '(', updateValue = '(', keys = Object.keys(updates);
  if (keys.length > 1) {
    for (var i = 0, count = keys.length - 1; i < count; i++) {
      updateField += keys[i] + ', ';
      updateValue += "'" + updates[keys[i]] + "', ";
    }
    updateField += keys[keys.length - 1];
    updateValue += "'" + updates[keys[keys.length - 1]] + "'";
  } else {
    updateField += keys[0];
    updateValue += "'" + updates[keys[0]] + "'";
  }
  this.updateString = 'UPDATE ' + this.table + ' SET ' + updateField + ') = ' + updateValue + ')';
  this.prevFunc = 'UPDATE';
  return this;
};

// TODO: COMPLETE
// Parameters: table (req)
// SQL: DELETE FROM table
// Special: May be chained with where, otherwise will remove all rows from table
ActiveRecord.prototype.remove = function () {
  this.selectString = 'DELETE FROM ' + this.table;
  this.prevFunc = 'DELETE';
  return this;
};

// TODO: COMPLETE
// Parameters: limit integer
// SQL: LIMIT number
ActiveRecord.prototype.limit = function (limit) {
  this.caboose += ' LIMIT ' + limit;
  return this;
};

// TODO: COMPLETE
// Parameters: offset integer
// SQL: OFFSET number
ActiveRecord.prototype.offset = function (offset) {
  this.caboose += ' OFFSET ' + offset;
  return this;
};

// TODO: COMPLETE
// Parameters: limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id ASC LIMIT 1, SELECT * FROM table ORDER BY table._id ASC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.first = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id ASC LIMIT ' + limit + ';';
  this.prevFunc = 'FIRST';
  return this;
};

// TODO: COMPLETE
// Parameters: limit (optional, defaults to 1)
// SQL: SELECT * FROM table ORDER BY table._id DESC LIMIT 1, SELECT * FROM table ORDER BY table._id DESC LIMIT limit
// Special: Retrieves first item, overrides all other chainable functions
ActiveRecord.prototype.last = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id DESC LIMIT ' + limit + ';';
  this.prevFunc = 'LAST';
  return this;
};

// TODO: COMPLETE
// Parameters: limit (optional, defaults to 1)
// SQL: SELECT * FROM table LIMIT 1, SELECT * FROM table LIMIT limit
// Special: Retrieves a record without ordering, overrides all other chainable functions
ActiveRecord.prototype.take = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' LIMIT ' + limit + ';';
  this.prevFunc = 'TAKE';
  return this;
};

// TODO: INCOMPLETE
// Parameters:
// SQL: GROUP BY
// Special:
ActiveRecord.prototype.group = function () {
  //this.caboose +=
  return this;
};

// TODO: INCOMPLETE
// Parameters:
// SQL: HAVING
// Special:
ActiveRecord.prototype.having = function () {
  //this.caboose +=
  return this;
};

// TODO: COMPLETE
// Parameters: None
// SQL: Combines previously chained items to create a SQL statement
// Special: Functions with an inputString override other chainable functions because they are complete
ActiveRecord.prototype.fetch = function () {
  var table = this.table;
  var dataArray = this.dataArray;
  var prevFunc = this.prevFunc;
  var input = this.inputString.length > 0 ? this.inputString : this.selectString + this.joinString + this.whereString + this.caboose + ';';
  console.log('FETCH:', input, dataArray);
  pg.connect(this.conString, function (err, client, done) {
    if (err) {
      console.log(err);
    }
    //console.log(input);
    client.query(input, dataArray, function (error, results) {
      if (error) {
        console.log("error in " + prevFunc + ' ' + table, error);
      } else {
        console.log("results in " + prevFunc + ' ' + table, results.rows);
      }
      done();
    });
  });
};

ActiveRecord.prototype.save = function () {
  var input = this.inputString.length > 0 ? this.inputString : this.updateString + this.joinString + this.whereString + ';';
  var dataArray = this.dataArray;
  var prevFunc = this.prevFunc;
  var table = this.table;
  var callback = function (err, results) {
      console.log(err, results);
    };
  console.log('SAVE:', input, dataArray);
  pg.connect(this.conString, function (err, client, done) {
    if (err) {
      console.log(err, "in " + prevFunc + ' ' + table);
    }
    client.query(input, dataArray, function (error, results) {
      callback(error, results);
    });
    done();
  });
};

ActiveRecord.prototype.createRelationship = function(relTable, relationship, columnNames){
  if (relationship === "onetomany"){
    this.inputString += "ALTER TABLE " +  this.table + " ADD " + relTable +
    "_id INTEGER references " + relTable + "(_id);";
  }
  else {
    this.inputString += "CREATE TABLE " +
    this.table + "_id integer references " + this.table + "(_id)" +
    relTable + "_id integer references " + relTable + "(_id)," +
    this.table + relTable + " PRIMARY KEY(" + this.table + "_id, " + relTable + "_id)";
    this.inputString +=  "CREATE OR REPLACE FUNCTION " + this.table + relTable + "(" + columnNames[0][0] + " " +
    columnNames[0][1] + ", " + columnNames[1][0] + " " + columnNames[1][1] + ") RETURNS trigger AS $$ " +
    "IF (TG_OP = 'DELETE') THEN " +
    "DELETE FROM " + this.table + relTable + " WHERE " + this.table + relTable + "_id = OLD._id " +
    "RETURN old; " +
    "ELSIF (TG_OP = 'INSERT') THEN " +
    "INSERT INTO " + this.table + relTable + " ( " + this.table + "_id, " + relTable + "_id, VALUES " +
    "(NEW._id, (SELECT _id from " + relTable + "WHERE " + relTable  + "_id = value;) " +
    "RETURN new " +
    "END IF; " +
    "END; " +
    "$$ LANGUAGE plpgsql; ";
    this.inputString += "CREATE TRIGGER " + this.table+relTable  + " AFTER INSERT OR DELETE ON " + this.table + " | " +
    relTable + " FOR EACH ROW EXECUTE PROCEDURE update" + this.table+relTable + "();";
  }

  return this;
};