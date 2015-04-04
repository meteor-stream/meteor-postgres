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

Postgres.DataTypes = {
  // TODO: data types
  number: 'int',
  string: 'varchar 255',
  json: 'json',
  datetime: 'timestamp',
  float: 'float'
}
;

Postgres.tableConstraints = {
  // TODO: unique, check, foreign key, exclude
};

/**
 * without a ref_col after related_table, it will use the id from the related_table
 * @param field_name
 * @param related_table
 * @returns {string}
 */
//Postgres.createForeignKey = function(field_name, related_table) {
//  // SQL: 'field_name integer references related_table'
//  return ' ' + field_name + ' integer references' + related_table;
//};

/**
 * TODO: add relationships? helper tables? triggers? add password and id field datatypes
 * @param {string} table
 * @param {object} tableObj
 * @param {string} tableObj key (field name)
 * @param {string} tableObj value (constraints)
 */
Postgres.createTable = function(table, tableObj, relTable) {
  // SQL: 'CREATE TABLE table (fieldName constraint);'
  // initialize input string parts
  var inputString = 'CREATE TABLE ' + table + '( id serial primary key not null';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    inputString += ', ' + key + ' ' + tableObj[key][0] + ' ' + tableObj[key][1];
  }
  // add foreign key
  if(relTable) {
    inputString += ' ' + relTable + '_id' + ' integer references' + relTable;
  }
  // add notify functionality and close input string
  inputString += ", created_at TIMESTAMPTZ default now()); " +
  "CREATE FUNCTION notify_trigger() RETURNS trigger AS $$ "+
  "DECLARE " +
  "BEGIN " +
  "PERFORM pg_notify('watchers', TG_TABLE_NAME || ',modified,' || NEW ); " +
  "RETURN new; " +
  "END; " +
  "$$ LANGUAGE plpgsql; " +
  "CREATE TRIGGER watched_table_trigger AFTER INSERT ON "+ table +
  " FOR EACH ROW EXECUTE PROCEDURE notify_trigger();";
  // send request to postgresql database
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in create table " + table, error);
      console.log("results in create table " + table, results);
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

/**
 * TODO:
 * @param {string} table1
 * @param {string} table2
 */
Postgres.createRelationship = function(table1, table2) {
  // SQL: 'CREATE TABLE table1_table2(
  //    table1_id INT NOT NULL REFERENCES table1(id) on delete cascade,
  //    table2_id INT NOT NULL REFERENCES table2(id) on delete cascade,
  //    primary key(table1_id, table2_id) );'
  var table = table1 + '_' + table2;
  var inputString = 'CREATE TABLE ' + table + '(' +
      table1 + '_id int not null references ' + table1 + '(id) on delete cascade,' +
      table2 + '_id int not null references ' + table2 + '(id) on delete cascade,' + ');';
  // send request to postgresql database
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in create relationship " + table, error);
      console.log("results in create relationship " + table, results);
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

// TODO: alter table
Postgres.alterTable = function() {};

/**
 * TODO: Cascade or restrict?
 * @param {string} table
 */
Postgres.dropTable = function(table) {
  var inputString = 'DROP TABLE IF EXISTS ' + table + ';';
  // send request to postgresql database
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in drop " + table, error);
      console.log("results in drop " + table, results);
      done();
    });
  });
};

/**
 * TODO: foreign key associations
 * @param {string} table
 * @param {object} insertObj
 * @param {string} insertObj key (field name)
 * @param {string} insertObj value (value)
 */
Postgres.insert = function(table, insertObj) {
  // SQL: 'INSERT INTO table (insertFields) VALUES (insertValues);'
  // initialize input string parts
  var inputString = 'INSERT INTO ' + table + ' (';
  var valueString = ') VALUES (';
  var keys = Object.keys(insertObj);
  var insertArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length - 1; i < count; ) {
    inputString += keys[i] + ', ';
    valueString += '$' + (++i) + ', ';
    insertArray.push(insertObj[keys[i]]);
  }
  // combine parts and close input string
  inputString += keys[keys.length-1] + valueString + '$' + keys.length + ');';
  insertArray.push(insertObj[keys[keys.length-1]]);
  // send request to postgresql database
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, insertArray, function(error, results) {
      console.log("error in insert " + table, error);
      console.log("results in insert " + table, results);
      done();
    });
  });
};


Postgres.QueryOperators = {
  $eq: ' = ',
  $gt: ' > ',
  $lt: ' < '
};

Postgres.SelectOptions = {
  $gb: 'GROUP BY ',
  $lim: 'LIMIT ',
  $off: 'OFFSET '
};

/**
 * TODO: Add joins, OR to selectObj
 * @param {object} tableObj
 * @param {string} tableObj key (table name)
 * @param {string} tableObj value (field name)
 * @param {object} selectObj
 * @param {string} selectObj key (field name)
 * @param {object} selectObj.fieldName key (operator)
 * @param {object} selectObj.fieldName value (comparator)
 * @param {object} optionsObj
 * @param {string} optionsObj key (option)
 * @param {number} optionsObj value (comparator)
 */
// Postgres.select(testScores); --> return ALL
// Postgres.select(testScores, { score: { $gt: '70' } }); --> return all data for students with score of 70 or above
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }); --> return student names with score of 70+
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }); --> return student names with score of 70+ grouped by classTime
Postgres.select = function(tableObj, selectObj, optionsObj) {
  // SQL: 'SELECT fields FROM table WHERE field operator comparator AND (more WHERE) GROUP BY field / LIMIT number / OFFSET number;'

  // tableObj
  // contains the table name as key and the fields as a string
  // for all fields user can pass in the table name as a string (need to insert * into the inputString)
  var table, returnFields;
  if (typeof tableObj === 'string') {
    table = tableObj;
    returnFields = ' * ';
  } else {
    table = Object.keys(tableObj)[0];
    returnFields = tableObj[table];
  }

  // selectObj
  // contains the field as a key then another obj as the value with the operator and conditional values
  var selectString = '';
  if (selectObj) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  var options = {
    $gb: 'GROUP BY ',
    $lim: 'LIMIT ',
    $off: 'OFFSET '
  };
  // optionsObj
  // object that can contain keys from SelectOptions and values of strings or integers or floats
  var optionString = '';
  if (optionsObj) {
    for (var key in optionsObj) {
      optionString += ' ' + options[key] + ' ' + optionsObj[key];
    }
  }

  var inputString = 'SELECT ' + returnFields + ' FROM ' + table + ' ' + selectString + ' ' + optionString + ';';
  console.log(inputString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in select " + table, error);
      console.log("results in select " + table, results.rows);
      done();
    });
  });
};

/**
 * TODO: OR to selectObj
 * @param {object} tableObj
 * @param {string} tableObj key (table name)
 * @param {string} tableObj value (field name) -> to update
 * @param {object} selectObj
 * @param {string} selectObj key (field name)
 * @param {object} selectObj.fieldName key (operator)
 * @param {object} selectObj.fieldName value (comparator) -> filters
 * @param {object} updateObj
 * @param {string} updateObj key (field name)
 * @param {number} updateObj value (updated data) -> updates
 */
Postgres.update = function(tableObj, updateObj, selectObj) {
  // SQL: 'SELECT fields FROM table WHERE field operator comparator AND (more WHERE) GROUP BY field / LIMIT number / OFFSET number;'

  // tableObj
  // contains the table name as key and the fields as a string
  // for all fields user can pass in the table name as a string (need to insert * into the inputString)
  var table, toUpdateFields;
  table = Object.keys(tableObj)[0];
  toUpdateFields = tableObj[table];

  // selectObj
  // contains the field as a key then another obj as the value with the operator and conditional values
  var selectString = '';
  if (selectObj) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  var updateString = '';
  for (var key in updateObj) {
    updateString += ' ' + options[key] + ' ' + optionsObj[key];
  }

  var inputString = 'UPDATE ' + table + ' SET ' + updateString + ' ' + selectString + ';';
  console.log(inputString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in select " + table, error);
      console.log("results in select " + table, results.rows);
      done();
    });
  });
};

/**
 * TODO: Additional where parameters
 * @param table
 * @param selectObj
 */
Postgres.delete = function (table, selectObj) {
  // SQL: 'DELETE FROM table * WHERE field operator comparator;'
  var inputString = 'DELETE FROM ' + table;

  var selectString = '';
  if (selectObj) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  inputString += selectString + ';';

  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      console.log("error in delete " + table, error);
      console.log("results in delete " + table, results.rows);
      done();
    });
  });
};
