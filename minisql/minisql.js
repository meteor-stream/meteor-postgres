/**
 * Created by ppp on 4/3/2015.
 */
//this file will generate the minisql on the client side necessary to match the postgres database

function _emptyObject(obj) {
  for (var prop in obj) {
    if (Object.prototype.propertyIsEnumerable.call(obj, prop)) {
      return false;
    }
  }
  return true;
}
var selectStatement = function(table, returnFields, selectObj, optionsObj) {
  if (!returnFields || returnFields.length === 0) {
    returnFields = ' * ';
  }
  else {
    returnFields = returnFields.join(', ');
  }

  //{ name: {$lm: 1}}
  var optionsString = '';
  if (optionsObj && !_emptyObject(optionsObj)) {
    var limit, group, offset, optionField;
    optionField = Object.keys(optionsObj)[0];
    group = optionsObj[optionField]['$gb'] ? (' GROUP BY ' + optionsObj[optionField]['$gb']) : '';
    offset = optionsObj[optionField]['$off'] ? (' OFFSET ' + optionsObj[optionField]['$off']) : '';
    limit = optionsObj[optionField]['$lm'] ? (' LIMIT ' + optionsObj[optionField]['$lm']) : '';
    optionsString += group + offset + limit;
  }

  // joinObj TODO: helper table joins && better interface for $fk/$tb
  // for foreign key it will be table1 join table2 on table1.table2_id = table2._id
  // {$fk: [$loj, 'contacts']}

  var inputString = 'SELECT ' + returnFields + ' FROM ' + table + "" + optionsString + ';';
  return inputString;
};

var insertStatement = function(table, insertObj){
  var inputString = 'INSERT INTO ' + table + ' (';
  var valueString = ') VALUES (';
  var keys = Object.keys(insertObj);
  var insertArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length - 1; i < count;) {
    inputString += keys[i] + ', ';
    insertArray.push(insertObj[keys[i++]]);
    valueString += '?, ';
  }
  // combine parts and close input string
  inputString += keys[keys.length - 1] + valueString + '?);';
  insertArray.push(insertObj[keys[keys.length - 1]]);
  return [inputString, insertArray];
};

var createTableStatement = function(table, tableObj, relTable){
  alasql.fn.Date= Date;
  var _DataTypes = {
    $number: 'INT',
    $string: 'varchar(255)',
    $json: 'json',
    $datetime: 'date',
    $float: 'FLOAT',
    $seq: 'serial',
    $bool: 'bool'
  };

  var _TableConstraints = {
    $unique: 'unique',
    $check: 'check ',
    $exclude: 'exclude',
    $notnull: 'not null',
    $default: 'default ',
    $primary: 'primary key'
  };

  var startString = 'CREATE TABLE ' + table + ' (';
  var item, subKey, valOperator, inputString = '';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    inputString += key + ' ';
    inputString += _DataTypes[tableObj[key][0]];
    if (Array.isArray(tableObj[key]) && tableObj[key].length > 1) {
      for (var i = 1, count = tableObj[key].length; i < count; i++) {
        item = tableObj[key][i];
        if (typeof item === 'object') {
          subKey = Object.keys(item);
          valOperator = _TableConstraints[subKey];
          inputString += ' ' + valOperator + item[subKey];
        } else {
          inputString += ' ' + _TableConstraints[item];
        }
      }
    }
    inputString += ', ';
  }
  // check to see if id provided
  if (inputString.indexOf('_id') === -1) {
    inputString += '_id integer primary key,';
  }
  // add foreign key
  if (relTable) {
    inputString += ' ' + relTable + '_id' + ' integer references ' + relTable + ' (_id)';
  }
  //inputString += ');';
  // add notify functionality and close input string
  inputString = startString + inputString;
  inputString += " created_at Date); ";
  return inputString;
};
function _where(selectObj) {
  var _QueryOperators = {
    $eq: ' = ',
    $gt: ' > ',
    $lt: ' < '
  };
  if (selectObj && !_emptyObject(selectObj)) {
    var selectField, operator, comparator, key;
    selectField = Object.keys(selectObj)[0];
    key = Object.keys(selectObj[selectField])[0];
    operator = _QueryOperators[key];
    comparator = selectObj[selectField][key];
    return ' WHERE ' + selectField + operator + comparator;
  } else {
    return '';
  }
}
var updateStatement = function(table, updateObj, selectObj) {
  var updateString = ''; // fields VALUE values {'class': 'senior'}
  if (updateObj && !_emptyObject(updateObj)) {
    var keys = Object.keys(updateObj);
    // if there are many fields
    if (keys.length > 1) {
      for (var i = 0, count = keys.length - 1; i < count; i++) {
        updateString += keys[i] + ' = ' + updateObj[keys[i]] + ", ";
      }
      updateString += keys[keys.length - 1] + updateObj[keys[keys.length - 1]];
    } else {
      // if there is only one field to update
      updateString += keys[0] + ' = ' + updateObj[keys[0]];
    }
  }
  var inputString = 'UPDATE ' + table + ' SET ' + updateString + _where(selectObj) + ';';
};

minisql = {};
/**
 * TODO: create table
 * @param name
 * @param {object} [options]
 * @param {dataType} object.field[0]
 * @param {constraint} object.field[1]
 */
minisql.createTable = function(name, object) {

  //var initString = 'CREATE TABLE ' + name + '( ';
  //for (var key in object) {
  //  if (key === '_id'){
  //    initString += key + ' ' + object[key][0] + ' ' + object[key][1] ;
  //  }
  //  else {
  //    initString += ' , ' + key + ' ' + object[key][0] + ' ' + object[key][1];
  //  }
  //}
  //// closes string
  //initString += ");";
  var initString = createTableStatement(name, object);
  alasql(initString);
};

/**
 * TODO: Add joins
 * @param name
 * @param {object} [options]
 * @param {columnNames} object.columnNames
 * @param {groupBy}  object.groupBy
 * @param {limit}  object.limit
 * @param {offset}  object.offset
 */
minisql.select = function(name, returnFields, selectObj, optionsObj) {
  // 'SELECT data FROM table WHERE parameters GROUP BY LIMIT OFFSET'
  // data parameters options (name directly passed in)
  //var columnNames = object.columnNames || '*';
  //var groupBy = object.groupBy ? ' GROUP BY ' + object.groupBy : '';
  //var limit = object.limit ? ' LIMIT ' + object.limit : '';
  //var offset = object.offset ? ' OFFSET ' + object.offset : '';
  //var initString = 'SELECT ' + columnNames + ' FROM ' + name + groupBy + limit + offset + ';';
  var initString = selectStatement(name, returnFields);
  return alasql(initString);
};

minisql.insert = function(name, params){
  //var insertText = "INSERT INTO " + name + " values ( " + params._id + ", " + "'" + params.text + "'" + ", false);"
  var insertText = insertStatement(name, params);
  alasql(insertText[0], insertText[1]);
};

minisql.update = function(table, updateObj, selectObj){
  var updateString = ''; // fields VALUE values {'class': 'senior'}
  if (updateObj && !_emptyObject(updateObj)) {
    var keys = Object.keys(updateObj);
    // if there are many fields
    if (keys.length > 1) {
      for (var i = 0, count = keys.length - 1; i < count; i++) {
        if (isNaN(updateObj[keys[i]]) || updateObj[keys[i]] instanceof Date) {
          updateString += keys[i] + ' = ' + "'" + updateObj[keys[i]] + "', ";
        } else {
          updateString += keys[i] + ' = ' + updateObj[keys[i]] + ", ";
        }
      }
      if (isNaN(updateObj[keys[keys.length - 1]]) || updateObj[keys[keys.length - 1]] instanceof Date) {
        updateString += keys[keys.length - 1] + " = '" + updateObj[keys[keys.length - 1]] + "'";
      } else {
        updateString += keys[keys.length - 1] + " = " + updateObj[keys[keys.length - 1]];
      }
    } else {
      // if there is only one field to update
      if (isNaN(updateObj[keys[0]]) || updateObj[keys[0]] instanceof Date) {
        updateString += keys[0] + ' = ' + "'" + updateObj[keys[0]] + "'";
      } else {
        updateString += keys[0] + ' = ' + updateObj[keys[0]];
      }
    }
  }
  var inputString = 'UPDATE ' + table + ' SET ' + updateString + _where(selectObj) + ';';
  alasql(inputString);
};

minisql.remove = function(table, selectObj){
  var inputString = 'DELETE FROM ' + table + _where(selectObj) + ';';
  alasql(inputString);
};