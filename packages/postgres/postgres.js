pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

/*var newTable = {
  username: ['varchar (100)', 'not null'],
  password: ['varchar (100)', 'not null'],
  name: ['varchar (255)', 'not null unique']
};

var newTable = {
  username: ['varchar (100)', 'not null'],
  password: ['varchar (100)', 'not null'],
  name: ['varchar (255)', 'not null unique']
};

var select = {

};

var where = {
  name: " = 'paulo'"
};

db.createTable('users', newTable);
db.insert('users', ['username', 'password', 'name'], ['pdiniz', 1234, 'paulo']);
db.update('users', ["name"], ["Paulo2"], where);
db.select('users', select);*/

Postgres = {
  'test': function(){
    return "Hello world";
  }
};

Postgres.QueryOperators = {
  $eq: ' = ',
  $gt: ' > ',
  $lt: ' < '
};

Postgres.DataTypes = {
  number: 'int',
  string: 'varchar 255',
  json: 'json',
  datetime: 'timestamp',
  float: 'float'
}
;

/**
 * TODO: add relationships? helper tables? triggers? add password and id field datatypes
 * @param {string} table
 * @param {object} tableObj
 * @param {string} tableObj key (field name)
 * @param {string} tableObj value (constraints)
 */
Postgres.createTable = function(table, tableObj) {
  // SQL: 'CREATE TABLE table (fieldName constraint);'
  // initialize input string parts
  var initString = 'CREATE TABLE ' + table + '( id serial primary key not null';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    initString += ', ' + key + ' ' + tableObj[key][0] + ' ' + tableObj[key][1];
  }
  // add notify functionality and close input string
  initString += ", created_at TIMESTAMPTZ default now()); " +
  "CREATE FUNCTION notify_trigger() RETURNS trigger AS $$ "+
  "DECLARE " +
  "BEGIN" +
  "PERFORM pg_notify('watchers', TG_TABLE_NAME || ',modified,' || NEW ); " +
  "RETURN new; " +
  "END; " +
  "$$ LANGUAGE plpgsql; " +
  "CREATE TRIGGER watched_table_trigger AFTER INSERT ON "+ table +
  " FOR EACH ROW EXECUTE PROCEDURE notify_trigger();";
  // send request to postgresql database
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(initString, function(error, results) {
      console.log("error in create table " + table, error);
      console.log("results in create table " + table, results);
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

///**
// * TODO:
// * @param {string} table
// * @param {array} insertFields
// * @param {array} insertValues
// */
//Postgres.insertArrays = function(table, insertFields, insertValues) {
//  // SQL: 'INSERT INTO table (insertFields) VALUES (insertValues);'
//  // initialize input string parts
//  var initString = 'INSERT INTO ' + table + ' (';
//  var valueString = ') VALUES (';
//  // iterate through array arguments to populate input string parts
//  for (var i = 0, count = insertFields.length - 1; i < count;) {
//    initString += insertFields[i] + ', ';
//    valueString += '$' + (++i) + ', ';
//  }
//  // combine parts and close input string
//  initString += insertFields[insertFields.length - 1] + valueString + '$' + insertFields.length + ');';
//  // send request to postgresql database
//  pg.connect(conString, function(err, client, done) {
//    console.log(err);
//    client.query(initString, insertValues, function(error, results) {
//      console.log("error in insert " + table, error);
//      console.log("results in insert " + table, results);
//      done();
//    });
//  });
//};

/**
 * TODO:
 * @param {string} table
 * @param {object} insertObj
 * @param {string} insertObj key (field name)
 * @param {string} insertObj value (value)
 */
Postgres.insert = function(table, insertObj) {
  // SQL: 'INSERT INTO table (insertFields) VALUES (insertValues);'
  // initialize input string parts
  var initString = 'INSERT INTO ' + table + ' (';
  var valueString = ') VALUES (';
  var keys = Object.keys(insertObj);
  var insertArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length - 1; i < count; ) {
    initString += keys[i] + ', ';
    valueString += '$' + (++i) + ', ';
    insertArray.push(insertObj[keys[i]]);
  }
  // combine parts and close input string
  initString += keys[keys.length-1] + valueString + '$' + keys.length + ');';
  insertArray.push(insertObj[keys[keys.length-1]]);
  // send request to postgresql database
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(initString, insertArray, function(error, results) {
      console.log("error in insert " + table, error);
      console.log("results in insert " + table, results);
      done();
    });
  });
};

/**
 * TODO: Add joins
 * @param table
 * @param {object} [options]
 * @param {columnNames} selectObj.columnNames
 * @param {groupBy}  selectObj.groupBy
 * @param {limit}  selectObj.limit
 * @param {offset}  selectObj.offset
 */
Postgres.select = function(table, selectObj) {
  // SQL: 'SELECT data FROM table WHERE parameters GROUP BY LIMIT OFFSET'
  var columnNames = selectObj.columnNames || '*';
  var groupBy =  selectObj.groupBy ? ' GROUP BY ' + selectObj.groupBy : '';
  var limit = selectObj.limit ? ' LIMIT ' + selectObj.limit : '';
  var offset = selectObj.offset ? ' OFFSET ' + selectObj.offset : '';
  var initString = 'SELECT ' + columnNames + ' FROM ' + table + groupBy + limit + offset + ';';
  console.log(initString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(initString, function(error, results) {
      console.log("error in select " + table, error);
      console.log("results in select " + table, results.rows);
      done();
    });
  });
};

/**
 * TODO: update
 * @param {string} table
 * @param {array} setFields
 * @param {array} setValues
 * @param {object} whereObj
 */
// Postgres.update(tableName, setFields, setValue, whereObj);
//whereObj = {
//  fieldName: {
//    operator: value
//  },
//};
// Postgres.update(testScores, [pass], [true], { score: { $gt: 75 } });
Postgres.update = function(table, setFields, setValues, whereObj) {
  var initString = 'UPDATE ' + table + ' SET '; // field names
  var valueString = ' = '; // where params
  var whereString = 'WHERE ';
  for (var i = 0, count = setFields.length - 1; i < count;) {
    initString += setFields[i] + ', ';
    valueString += '$' + (++i) + ', ';
  }
  for (var field in where) {
    whereString += field + where[field] + ', ';
  }
  whereString = whereString.substring(0, whereString.length - 2);
  // 'INSERT INTO ' + table + ' (' + setFields
  initString += setFields[setFields.length - 1] + valueString + '$' + setFields.length + ' ' + whereString + ';';
  console.log(initString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(initString, setValues, function(error, results) {
      console.log("error in insert " + table, error);
      console.log("results in insert " + table, results);
      done();
    });
  });
};

//Postgres.QueryOperators = {
//  $eq: ' = ',
//  $gt: ' > ',
//  $lt: ' < '
//};