/**
 * Created by ppp on 4/3/2015.
 */
//this file will generate the minisql on the client side necessary to match the postgres database
minisql = {};
/**
 * TODO: create table
 * @param name
 * @param {object} [options]
 * @param {dataType} object.field[0]
 * @param {constraint} object.field[1]
 */
minisql.createTable = function(name, object) {
  var initString = 'CREATE TABLE ' + name + '( ';
  for (var key in object) {
    if (key === 'id'){
      initString += key + ' ' + object[key][0] + ' ' + object[key][1] ;
    }
    else {
      initString += ' , ' + key + ' ' + object[key][0] + ' ' + object[key][1];
    }
  }
  // closes string
  initString += ");";
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
minisql.select = function(name, object) {
  // 'SELECT data FROM table WHERE parameters GROUP BY LIMIT OFFSET'
  // data parameters options (name directly passed in)
  var columnNames = object.columnNames || '*';
  var groupBy = object.groupBy ? ' GROUP BY ' + object.groupBy : '';
  var limit = object.limit ? ' LIMIT ' + object.limit : '';
  var offset = object.offset ? ' OFFSET ' + object.offset : '';
  var initString = 'SELECT ' + columnNames + ' FROM ' + name + groupBy + limit + offset + ';';
  return alasql(initString);
};

minisql.insert = function(name, params){
  var inserttext = "INSERT INTO " + name + " values ( 'DEFAULT', " + "'" + params.text + "'" + ", false);";
  alasql(inserttext);
};

minisql.update = function(name, params){
  alasql("UPDATE " + name + " SET " + params.column + " = " + params.value + " WHERE ID = " + params.id);
};

minisql.remove = function(name, params){
  alasql("DELETE FROM " + name + " WHERE id = " + params);
};