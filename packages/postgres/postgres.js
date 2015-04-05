// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

Postgres = {};

/* objects: DataTypes, TableConstraints, QueryOperators, SelectOptions, and Joins */

Postgres._DataTypes = {
  // TODO: data types, not currently in use
  number: 'int',
  string: 'varchar 255',
  json: 'json',
  datetime: 'timestamp',
  float: 'float'
};

Postgres._TableConstraints = {
  // TODO: unique, check, foreign key, exclude
};

Postgres._QueryOperators = {
  // TODO: not currently in use
  $eq: ' = ',
  $gt: ' > ',
  $lt: ' < '
};

Postgres._SelectOptions = {
  // TODO: not currently in use
  $gb: 'GROUP BY ',
  $lim: 'LIMIT ',
  $off: 'OFFSET '
};

Postgres._Joins = {
  $loj: ' LEFT OUTER JOIN ',
  $lij: ' LEFT INNER JOIN '
};

/* methods: createTable, createRelationship, alterTable, dropTable, insert, select, update, delete, autoSelect */

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
    inputString += ', ' + key + ' ' + tableObj[key];
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
  "PERFORM pg_notify('watchers', '{' || TG_TABLE_NAME || ':' || NEW.id || '}'); " +
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
      console.log(msg.payload);
      var returnMsg = eval("(" + msg.payload + ")");
      console.log(returnMsg);
      console.log(typeof returnMsg);
      console.log(returnMsg.tasks);
      var k = '';
      var v = '';
      for (var key in returnMsg){
        k = key;
        v = returnMsg[key];
      }
      var selectString = "select * from " + k + " where id = " + v + ";";
      client.query(selectString, function(error, results) {
        console.log("error in create table " + table, error);
        console.log("results in create table ", results.rows);
      });

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




/**
 * TODO: Add right joins?, OR to selectObj, should work for all but tableObj to by empty
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
// SQL: SELECT fields FROM table1 JOIN table2 ON table1.id = table2.id WHERE ... --when they are connected via helper table
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }, { $roj: 'class' }); --> ids from both tables used for join
// SQL: SELECT fields FROM table1 JOIN table2 ON table1.id = table2.id WHERE ... --when they are connected via foreign key in first table
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }, { $loj: 'class',  }); // $loj, $lij
Postgres.select = function(tableObj, selectObj, optionsObj, joinObj) {
  // SQL: 'SELECT fields FROM table WHERE field operator comparator AND (more WHERE) GROUP BY field / LIMIT number / OFFSET number;'

  // tableObj
  // contains the table name as key and the fields as a string
  // for all fields user can pass in the table name as a string (need to insert * into the inputString)
  var table, returnFields;
  if (typeof tableObj === 'string') {
    table = tableObj;
    returnFields = ' * ';
  } else if (Object.keys(tableObj).length === 1) {
    table = Object.keys(tableObj)[0];
    returnFields = tableObj[table];
  }

  // selectObj
  // contains the field as a key then another obj as the value with the operator and conditional values
  var selectString = '';
  if (Object.keys(selectObj).length === 0) {
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
  if (Object.keys(optionsObj).length === 0) {
    for (var key in optionsObj) {
      optionString += ' ' + options[key] + ' ' + optionsObj[key];
    }
  }

  // joinObj
  // object contains keys from join and values of table names
  //JOIN table2 ON table1.id = table2.id --> { $roj: 'class' }
  // foreign key will always be foreignTable_id because of code in createTable
  // foreign key:
  // SELECT * FROM table1 LEFT OUTER JOIN table2 ON table1(foreign_id) = table2(id)
  var joinString = '';
  var joinTable, joinType;
  if (Object.keys(joinObj).length === 0) {
    joinType = Object.keys(joinObj)[0]; // '$loj'
    joinTable = tableObj[joinType]; // 'class'
    joinString = Postgres._Joins(joinType); // ' LEFT OUTER JOIN class ON students.class_id = class(id);
    joinString += joinTable + ' ON '+ table + '.' + joinTable + '_id = ' + joinTable + '(id)' + ';';
  }


  var inputString = 'SELECT ' + returnFields + ' FROM ' + table + joinString + ' ' + selectString + ' ' + optionString + ';';
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

Postgres.autoSelect = function () {
  client.on('notification', function(msg) {
    console.log(msg.payload);
    var returnMsg = eval("(" + msg.payload + ")");
    console.log(returnMsg);
    console.log(typeof returnMsg);
    console.log(returnMsg.tasks);
    var k = '';
    var v = '';
    for (var key in returnMsg) {
      k = key;
      v = returnMsg[key];
    }
    var selectString = "select * from " + k + " where id = " + v + ";";
    client.query(selectString, function(error, results) {
      console.log("error in create table " + table, error);
      console.log("results in create table ", results.rows);
    });
  });
};
