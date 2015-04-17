//this file will generate the minisql on the client side necessary to match the postgres database

MiniSQL = function (table) {

  // initialize class
  this.table = table;

  // inputString used by queries, overrides other strings
  // includes: create table, create relationship, drop table, insert
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

  this.prototype = MiniSQL.prototype;
};

MiniSQL.prototype._DataTypes = {
  $number: 'integer',
  $string: 'varchar(255)',
  $json: 'json',
  $datetime: 'date',
  $float: 'decimal',
  $seq: 'serial',
  $bool: 'boolean'
};

MiniSQL.prototype._TableConstraints = {
  $unique: 'unique',
  $check: 'check ', // value
  $exclude: 'exclude',
  $notnull: 'not null',
  $default: 'default ', // value
  $primary: 'primary key'
};

MiniSQL.prototype.createTable = function (tableObj) {
  alasql.fn.Date = Date;

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
  // check to see if _id already provided
  if (inputString.indexOf('_id') === -1) {
    startString += '_id serial primary key,';
  }

  this.inputString = startString + inputString + " created_at Date); ";
  this.prevFunc = 'CREATE TABLE';
  return this;
};

MiniSQL.prototype.dropTable = function () {
  this.inputString = 'DROP TABLE IF EXISTS ' + this.table + ' CASCADE;';
  this.prevFunc = 'DROP TABLE';
  return this;
};

MiniSQL.prototype.insert = function (inserts) {
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

MiniSQL.prototype.update = function (updates) {
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

MiniSQL.prototype.remove = function () {
  this.deleteString = 'DELETE FROM ' + this.table;
  this.prevFunc = 'DELETE';
  return this;
};

MiniSQL.prototype.select = function (/*arguments*/) {
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

MiniSQL.prototype.findOne = function (/*arguments*/) {
  if (arguments.length === 2) {
    this.inputString = 'SELECT * FROM ' + this.table + ' WHERE ' + this.table + '._id = ' + args + ' LIMIT 1;';
  } else {
    this.inputString = 'SELECT * FROM ' + this.table + ' LIMIT 1';
  }
  this.prevFunc = 'FIND ONE';
  return this;
};

MiniSQL.prototype.join = function (joinType, fields, joinTable) {
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

MiniSQL.prototype.where = function (/*Arguments*/) {
  this.dataArray = [];
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
  this.whereString = ' WHERE ' + where;
  return this;
};

MiniSQL.prototype.order = function (/*arguments*/) {
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

MiniSQL.prototype.limit = function (limit) {
  this.limitString = ' LIMIT ' + limit;
  return this;
};

MiniSQL.prototype.offset = function (offset) {
  this.offsetString = ' OFFSET ' + offset;
  return this;
};

MiniSQL.prototype.group = function (group) {
  this.groupString = 'GROUP BY ' + group;
  return this;
};

MiniSQL.prototype.first = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id ASC LIMIT ' + limit + ';';
  this.prevFunc = 'FIRST';
  return this;
};

MiniSQL.prototype.last = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' ORDER BY ' + this.table + '._id DESC LIMIT ' + limit + ';';
  this.prevFunc = 'LAST';
  return this;
};

MiniSQL.prototype.take = function (limit) {
  limit = limit || 1;
  this.inputString += 'SELECT * FROM ' + this.table + ' LIMIT ' + limit + ';';
  this.prevFunc = 'TAKE';
  return this;
};

MiniSQL.prototype.clearAll = function() {
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

MiniSQL.prototype.fetch = function () {

  //var table = this.table;
  //var prevFunc = this.prevFunc;

  var dataArray = this.dataArray;
  var starter = this.updateString || this.deleteString || this.selectString;

  var input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.whereString + this.orderString + this.limitString +
  this.offsetString + this.groupString + this.havingString + ';';

  // alaSQL
  alasql(input, dataArray);

  this.clearAll();
};

MiniSQL.prototype.save = function () {

  //var table = this.table;
  //var prevFunc = this.prevFunc;

  var dataArray = this.dataArray;
  var starter = this.updateString || this.deleteString || this.selectString;
  var input = this.inputString.length > 0 ? this.inputString : starter + this.joinString + this.whereString + ';';

  // alaSQL
  alasql(input, dataArray);

  this.clearAll();
};
