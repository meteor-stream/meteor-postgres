pg = Npm.require('pg'); // Node-Postgres
var clientHolder = {};

function removeListeningConnections(){
  for (var key in clientHolder) {
    clientHolder[key].end();
  }
}

process.on('exit', removeListeningConnections);
_.each(['SIGINT', 'SIGHUP', 'SIGTERM'], function (sig) {
  process.once(sig, function () {
    removeListeningConnections();
    process.kill(process.pid, sig);
  });
});

/**
 * @param Collection
 * @constructor
 */
serverSQL = function (Collection) {

  Collection = Collection || Object.create(serverSQL.prototype);
  Collection.table = Collection.tableName;

  Collection.conString = process.env.MP_POSTGRES || process.env.DATABASE_URL;
  // inputString used by queries, overrides other strings
  // includes: create table, create relationship, drop table, insert
  Collection.inputString = '';
  Collection.autoSelectData = '';
  Collection.autoSelectInput = '';

  // statement starters
  Collection.selectString = '';
  Collection.updateString = '';
  Collection.deleteString = '';

  // chaining statements
  Collection.joinString = '';
  Collection.whereString = '';

  // caboose statements
  Collection.orderString = '';
  Collection.limitString = '';
  Collection.offsetString = '';
  Collection.groupString = '';
  Collection.havingString = '';

  Collection.dataArray = [];

  // error logging
  Collection.prevFunc = '';
  return Collection;
};

/**
 * Data Types
 * @type {{$number: string, $string: string, $json: string, $datetime: string, $float: string, $seq: string, $bool: string}}
 * @private
 */
serverSQL.prototype._DataTypes = {
  $number: 'integer',
  $string: 'varchar(255)',
  $json: 'json',
  $datetime: 'date',
  $float: 'decimal',
  $seq: 'serial',
  $bool: 'boolean'
};

/**
 * Table Constraints
 * @type {{$unique: string, $check: string, $exclude: string, $notnull: string, $default: string, $primary: string}}
 * @private
 */
serverSQL.prototype._TableConstraints = {
  $unique: 'unique',
  $check: 'check ', // value
  $exclude: 'exclude',
  $notnull: 'not null',
  $default: 'default ', // value
  $primary: 'primary key'
};

/**
 * SQL: CREATE TABLE field data_type constraint
 * Notes: Required for all SQL Collections, must use prescribed data types and table constraints
 * Type: Query
 * @param tableObj
 */
serverSQL.prototype.createTable = function (tableObj) {

  var startString = 'CREATE TABLE ' + this.table + ' (';
  var item, subKey, valOperator, inputString = '';

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
  // check to see if id already provided
  if (inputString.indexOf('id') === -1) {
    startString += 'id serial primary key,';
  }

  this.inputString = startString + inputString + " createdat TIMESTAMP default now()); " +
  "CREATE OR REPLACE FUNCTION notify_trigger_" + this.table + "() RETURNS trigger AS $$" +
  "BEGIN" +
  " IF (TG_OP = 'DELETE') THEN " +
  "PERFORM pg_notify('notify_trigger_" + this.table + "', '[{' || TG_TABLE_NAME || ':' || OLD.id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN old;" +
  "ELSIF (TG_OP = 'INSERT') THEN " +
  "PERFORM pg_notify('notify_trigger_" + this.table + "', '[{' || TG_TABLE_NAME || ':' || NEW.id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN new; " +
  "ELSIF (TG_OP = 'UPDATE') THEN " +
  "PERFORM pg_notify('notify_trigger_" + this.table + "', '[{' || TG_TABLE_NAME || ':' || NEW.id || '}, { operation: " +
  "\"' || TG_OP || '\"}]');" +
  "RETURN new; " +
  "END IF; " +
  "END; " +
  "$$ LANGUAGE plpgsql; " +
  "CREATE TRIGGER watched_table_trigger AFTER INSERT OR DELETE OR UPDATE ON " + this.table +
  " FOR EACH ROW EXECUTE PROCEDURE notify_trigger_" + this.table + "();";

  this.prevFunc = 'CREATE TABLE';
  return this;
};

/**
 * Notes: Deletes cascade
 * SQL: DROP TABLE <table>
 */
serverSQL.prototype.dropTable = function () {
  this.inputString = 'DROP TABLE IF EXISTS ' + this.table + ' CASCADE; DROP FUNCTION IF EXISTS notify_trigger_' + this.table + '() CASCADE;';
  this.prevFunc = 'DROP TABLE';
  return this;
};

/**
 * SQL: INSERT INTO <table> (<fields>) VALUES (<values>)
 * Type: Query
 * @param insertObj
 */
serverSQL.prototype.insert = function (insertObj) {
  var valueString = ') VALUES (', keys = Object.keys(insertObj);
  var insertString = 'INSERT INTO ' + this.table + ' (';
  this.dataArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length; i < count;) {
    insertString += keys[i] + ', ';
    this.dataArray.push(insertObj[keys[i]]);
    valueString += '$' + (++i) + ', ';
  }
  this.inputString = insertString.substring(0, insertString.length - 2) + valueString.substring(0, valueString.length - 2) + ');';
  this.prevFunc = 'INSERT';
  return this;
};

/**
 * SQL: UPDATE <table> SET (<fields>) = (<values>)
 * Type: Statement Starter
 * @param {object} updatesObj
 * @param {string} updatesObj Key (Field)
 * @param {string} updatesObj Value (Data)
 */
serverSQL.prototype.update = function (updatesObj) {
  var updateField = '(', updateValue = '(', keys = Object.keys(updatesObj);
  if (keys.length > 1) {
    for (var i = 0, count = keys.length - 1; i < count; i++) {
      updateField += keys[i] + ', ';
      updateValue += "'" + updatesObj[keys[i]] + "', ";
    }
    updateField += keys[keys.length - 1];
    updateValue += "'" + updatesObj[keys[keys.length - 1]] + "'";
  } else {
    updateField += keys[0];
    updateValue += "'" + updatesObj[keys[0]] + "'";
  }
  this.updateString = 'UPDATE ' + this.table + ' SET ' + updateField + ') = ' + updateValue + ')';
  this.prevFunc = 'UPDATE';
  return this;
};

/**
 * SQL: DELETE FROM table
 * Type: Statement Starter
 * Notes: If not chained with where it will remove all rows
 */
serverSQL.prototype.remove = function () {
  this.deleteString = 'DELETE FROM ' + this.table;
  this.prevFunc = 'DELETE';
  return this;
};

// Parameters: fields (arguments, optional)
// SQL: SELECT fields FROM table, SELECT * FROM table
// Special: May pass table, distinct, field to obtain a single record per unique value
// STATEMENT STARTER/SELECT STRING
/**
 * SQL: SELECT fields FROM table, SELECT * FROM table
 * Type: Statement Starter
 * Notes: May pass distinct, field (two separate arguments) to obtain a single record per unique value
 * @param {string} [arguments]
 * fields to select
 */
serverSQL.prototype.select = function (/*arguments*/) {
  var args = '';
  if (arguments.length >= 1) {
    for (var i = 0; i < arguments.length; i++) {
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
  this.selectString = 'SELECT ' + args + ' FROM ' + this.table + " ";
  this.prevFunc = 'SELECT';
  return this;
};

/**
 * SQL: SELECT * FROM table WHERE table.id = id LIMIT 1; SELECT * FROM table LIMIT 1;
 * Notes: If no id is passed will return random
 * Type: Query
 * @param {number} [id]
 */
serverSQL.prototype.findOne = function (/*arguments*/) {
  if (arguments.length === 1) {
    var args = arguments[0];
    this.inputString = 'SELECT * FROM ' + this.table + ' WHERE ' + this.table + '.id = ' + args + ' LIMIT 1;';
  } else {
    this.inputString = 'SELECT * FROM ' + this.table + ' LIMIT 1';
  }
  this.prevFunc = 'FIND ONE';
  return this;
};

/**
 * SQL: JOIN joinTable ON field = field
 * Type: Statement
 * Notes: Parameters can also be all arrays
 * @param {String} joinType
 * @param {String} fields
 * @param {String} joinTable
 */
serverSQL.prototype.join = function (joinType, fields, joinTable) {
  if (Array.isArray(joinType)) {
    for (var x = 0, count = fields.length; x < count; x++){
      this.joinString = " " + joinType[x] + " " + joinTable[x][0] + " ON " + this.table + "." + fields[x] + " = " + joinTable[x][0] + "." + joinTable[x][1];
    }
  } else {
    this.joinString = " " + joinType + " " + joinTable + " ON " + this.table + "." + fields + " = " + joinTable + "." + joinTable;
  }
  this.prevFunc = "JOIN";
  return this;
};

/**
 * SQL: WHERE field operator comparator, WHERE field1 operator1 comparator1 AND/OR field2 operator2 comparator2, WHERE field IN (x, y)
 * Type: Statement
 * Notes:
 * @param {string} directions
 * condition with ?'s for values
 * @param {string} values
 * values to be used
 */
serverSQL.prototype.where = function (/*Arguments*/) {
  this.dataArray = [];
  var where = '', redux, substring1, substring2;
  where += arguments[0];
  for (var i = 1, count = arguments.length; i < count; i++) {
    if (Array.isArray(arguments[i])) {
      if (arguments[i].length === 0) {
        throw new Error('Invalid input: array is empty');
      }
      redux = where.indexOf('?');
      substring1 = where.substring(0, redux);
      substring2 = where.substring(redux + 1, where.length);
      where = substring1 + 'ANY($' + i + ')'+ substring2;
      this.dataArray.push(arguments[i]);
    } else {
      redux = where.indexOf('?');
      substring1 = where.substring(0, redux);
      substring2 = where.substring(redux + 1, where.length);
      where = substring1 + '$' + i + substring2;
      this.dataArray.push(arguments[i]);
    }
  }
  this.whereString = ' WHERE ' + where;
  return this;
};

/**
 * SQL: ORDER BY fields
 * Notes: ASC is default, add DESC after the field name to reverse
 * Type: Caboose
 * @param {string} fields
 */
serverSQL.prototype.order = function (/*arguments*/) {
  var args = '';
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) {
      args += arguments[i] + ', ';
    }
    args = args.substring(0, args.length - 2);
  } else {
    args = arguments[0];
  }
  this.orderString = ' ORDER BY ' + args;
  return this;
};

/**
 * SQL: LIMIT number
 * Type: Caboose
 * @param {number} limit
 */
serverSQL.prototype.limit = function (limit) {
  this.limitString = ' LIMIT ' + limit;
  return this;
};

/**
 * SQL: OFFSET number
 * Type: Caboose
 * @param {number} offset
 */
serverSQL.prototype.offset = function (offset) {
  this.offsetString = ' OFFSET ' + offset;
  return this;
};

/**
 * SQL: GROUP BY field
 * Type: Caboose
 * @param {string} group
 */
serverSQL.prototype.group = function (group) {
  this.groupString = 'GROUP BY ' + group;
  return this;
};

// TODO: HAVING

/**
 * SQL: SELECT * FROM table ORDER BY table.id ASC LIMIT 1, SELECT * FROM table ORDER BY table.id ASC LIMIT limit
 * Type: Query
 * @param limit
 */
serverSQL.prototype.first = function (limit) {
  limit = limit || 1;
  this.clearAll();
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '.id ASC LIMIT ' + limit + ';';
  this.prevFunc = 'FIRST';
  return this;
};

/**
 * SQL: SELECT * FROM table ORDER BY table.id DESC LIMIT 1, SELECT * FROM table ORDER BY table.id DESC LIMIT limit
 * Type: Query
 * @param {number} limit
 */
serverSQL.prototype.last = function (limit) {
  limit = limit || 1;
  this.clearAll();
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '.id DESC LIMIT ' + limit + ';';
  this.prevFunc = 'LAST';
  return this;
};

/**
 * SQL: SELECT * FROM table LIMIT 1, SELECT * FROM table LIMIT limit
 * Type: Query
 * @param {number} limit
 * Defaults to 1
 */
serverSQL.prototype.take = function (limit) {
  limit = limit || 1;
  this.clearAll();
  this.inputString += 'SELECT * FROM ' + this.table + ' LIMIT ' + limit + ';';
  this.prevFunc = 'TAKE';
  return this;
};

/**
 * Type: Data method
 * @param {string} input
 * @param {array} data
 * @param {function} cb
 */
serverSQL.prototype.fetch = function (input, data, cb) {
  var table = this.table;
  var dataArray = data || this.dataArray;
  var prevFunc = this.prevFunc;

  var starter = this.updateString || this.deleteString || this.selectString;

  if (!input) {
    input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.whereString + this.orderString + this.limitString +
    this.offsetString + this.groupString + this.havingString + ';';
  }

  //cb = cb || function(prevFunc, table, results) {return console.log("results in " + prevFunc + ' ' + table, results.rows)};
  pg.connect(this.conString, function (err, client, done) {
    if (err) {
      console.log(err, "in " + prevFunc + ' ' + table);
      console.log('Input Statement: ', input);
    }
    client.query(input, dataArray, function (error, results) {
      if (cb) { cb(error, results); }
      done();
    });
  });
  this.clearAll();
};

/**
 * Type: Data method
 * @param {string} input
 * @param {array} data
 * @param {function} cb
 */
serverSQL.prototype.save = function (input, data, cb) {

  var table = this.table;
  var dataArray = data || this.dataArray;
  var prevFunc = this.prevFunc;

  var starter = this.updateString || this.deleteString || this.selectString;

  if (!input) {
    input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.whereString + ';';
  }

  pg.connect(this.conString, function (err, client, done) {
    if (err) {
      console.log(err, "in " + prevFunc + ' ' + table);
      console.log('Input Statement: ', input);
    }
    client.query(input, dataArray, function (error, results) {
      if (cb) { cb(error, results); }
    });
    done();
  });
  this.clearAll();
};

/**
 * Type: Maintenance
 */
serverSQL.prototype.clearAll = function() {
  this.inputString = '';
  this.autoSelectData = '';
  this.autoSelectInput = '';

  // statement starters
  this.selectString = '';
  this.updateString = '';
  this.deleteString = '';

  // chaining statements
  this.joinString = '';
  this.whereString = '';

  // caboose statements
  this.orderString = '';
  this.limitString = '';
  this.offsetString = '';
  this.groupString = '';
  this.havingString = '';

  this.dataArray = [];

  // error logging
  this.prevFunc = '';
};

/**
 * Type: Query
 * @param {string} relTable
 * @param {string} relationship
 */
serverSQL.prototype.createRelationship = function(relTable, relationship){
  if (relationship === "$onetomany"){
    this.inputString = "ALTER TABLE " +  this.table + " ADD " + relTable +
    "id INTEGER references " + relTable + "(id) ON DELETE CASCADE;";
  }
  else {
    this.inputString = "CREATE TABLE IF NOT EXISTS" +
    this.table + relTable + " (" + this.table + "id integer references " + this.table + "(id) ON DELETE CASCADE, " +
    relTable + "id integer references " + relTable + "(id) ON DELETE CASCADE, " +
    "PRIMARY KEY(" + this.table + "id, " + relTable + "id)); ";
  }
  return this;
};

/**
 *
 * @returns {string|*|string} input string
 */
serverSQL.prototype.returnSql = function(){
  var table = this.table;
  var dataArray = this.dataArray;
  var prevFunc = this.prevFunc;

  var starter = this.updateString || this.deleteString || this.selectString;

  var input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.whereString + this.orderString + this.limitString +
  this.offsetString + this.groupString + this.havingString + ';';

  return input;
};

/**
 *
 * @param sub
 */
serverSQL.prototype.autoSelect = function(sub) {

  // We need a dedicated client to watch for changes on each table. We store these clients in
  // our clientHolder and only create a new one if one does not already exist
  var table = this.table;
  var prevFunc = this.prevFunc;
  var newWhere = this.whereString;
  var newSelect = newSelect || this.selectString;
  var newJoin = newJoin || this.joinString;

  this.autoSelectInput = this.autoSelectInput !== "" ? this.autoSelectInput : this.selectString + this.joinString + newWhere + this.orderString + this.limitString + ';';
  this.autoSelectData = this.autoSelectData !== "" ? this.autoSelectData  : this.dataArray;
  var value = this.autoSelectInput;
  this.clearAll();


  var loadAutoSelectClient = function(name, cb){
    // Function to load a new client, store it, and then send it to the function to add the watcher
    var context = this;
    var client = new pg.Client(process.env.MP_POSTGRES);
    client.connect();
    clientHolder[name] = client;
    cb(client);
  };

  var autoSelectHelper = function(client1){
    // Selecting all from the table
    client1.query(value, function(error, results) {
      if (error) {
        console.log(error, "in autoSelect top")
      } else {
        sub._session.send({
          msg: 'added',
          collection: sub._name,
          id: sub._subscriptionId,
          fields: {
            reset: false,
            results: results.rows
          }
        });
      }
    });
    // Adding notification triggers
    var query = client1.query("LISTEN notify_trigger_" + table);
    client1.on('notification', function(msg) {
      var returnMsg = eval("(" + msg.payload + ")");
      var k = sub._name;
      if (returnMsg[1].operation === "DELETE") {
        var tableId = parseInt(returnMsg[0][k]);
        sub._session.send({
          msg: 'changed',
          collection: sub._name,
          id: sub._subscriptionId,
          index: tableId,
          fields: {
            removed: true,
            reset: false,
            tableId:tableId
          }
        });
      }
      else if (returnMsg[1].operation === "UPDATE") {
        var selectString = newSelect + newJoin + " WHERE " + table + ".id = " + returnMsg[0][table];
        pg.connect(process.env.MP_POSTGRES, function (err, client, done) {
          if (err) {
            console.log(err, "in " + prevFunc + ' ' + table);
          }
          client.query(selectString, this.autoSelectData, function(error, results) {
            if (error) {
              console.log(error, "in autoSelect update");
            } else {
              done();
              sub._session.send({
                msg: 'changed',
                collection: sub._name,
                id: sub._subscriptionId,
                index: tableId,
                fields: {
                  modified: true,
                  removed: false,
                  reset: false,
                  results: results.rows[0]
                }
              });
            }
          });
        });
      }
      else if (returnMsg[1].operation === "INSERT") {
        var selectString = newSelect + newJoin + " WHERE " + table + ".id = " + returnMsg[0][table];
        pg.connect(process.env.MP_POSTGRES, function (err, client, done) {
          if (err) {
            console.log(err, "in " + prevFunc + ' ' + table);
          }
          client.query(selectString, this.autoSelectData, function(error, results) {
            if (error) {
            } else {
              done();
              sub._session.send({
                msg: 'changed',
                collection: sub._name,
                id: sub._subscriptionId,
                fields: {
                  removed: false,
                  reset: false,
                  results: results.rows[0]
                }
              });
            }
          });
        });
      }
    });
  };

  // Checking to see if this table already has a dedicated client before adding the listener
  if(clientHolder[table]){
    autoSelectHelper(clientHolder[table]);
  } else{
    loadAutoSelectClient(table, autoSelectHelper);
  }

};
