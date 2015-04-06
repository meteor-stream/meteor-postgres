"use strict";

var _core = require("babel-runtime/core-js")["default"];

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

var _ = require("lodash");
var pg = require("pg");
var randomString = require("random-strings");

module.exports = {

	/**
  * Obtain a node-postgres client from the connection pool
  * @param  String  connectionString "postgres://user:pass@host/database"
  * @return Promise { client, done() } Call done() to return client to pool!
  */
	getClient: function getClient(connectionString) {
		return new _core.Promise(function (resolve, reject) {
			pg.connect(connectionString, function (error, client, done) {
				if (error) reject(error);else resolve({ client: client, done: done });
			});
		});
	},

	/**
  * Perform a query
  * @param  Object client node-postgres client
  * @param  String query  SQL statement
  * @param  Array  params Optional, values to substitute into query
  *                       (params[0] => '$1'...)
  * @return Promise Array Result set
  */
	performQuery: function performQuery(client, query) {
		var params = arguments[2] === undefined ? [] : arguments[2];

		return new _core.Promise(function (resolve, reject) {
			client.query(query, params, function (error, result) {
				if (error) reject(error);else resolve(result);
			});
		});
	},

	/**
  * Query information_schema to determine tables used and if updatable
  * @param  Object client node-postgres client
  * @param  String query  SQL statement, params not used
  * @return Promise Array Table names
  */
	getQueryDetails: function getQueryDetails(client, query) {
		var nullifiedQuery, viewName, tablesResult, isUpdatableResult;
		return _regeneratorRuntime.async(function getQueryDetails$(context$1$0) {
			while (1) switch (context$1$0.prev = context$1$0.next) {
				case 0:
					nullifiedQuery = query.replace(/\$\d+/g, "NULL");
					viewName = "tmp_view_" + randomString.alphaLower(10);
					context$1$0.next = 4;
					return exports.performQuery(client, "CREATE OR REPLACE TEMP VIEW " + viewName + " AS (" + nullifiedQuery + ")");

				case 4:
					context$1$0.next = 6;
					return exports.performQuery(client, "SELECT DISTINCT vc.table_name\n\t\t\t\tFROM information_schema.view_column_usage vc\n\t\t\t\tWHERE view_name = $1", [viewName]);

				case 6:
					tablesResult = context$1$0.sent;
					context$1$0.next = 9;
					return exports.performQuery(client, "SELECT is_updatable\n\t\t\t\tFROM information_schema.views\n\t\t\t\tWHERE table_name = $1", [viewName]);

				case 9:
					isUpdatableResult = context$1$0.sent;
					context$1$0.next = 12;
					return exports.performQuery(client, "DROP VIEW " + viewName);

				case 12:
					return context$1$0.abrupt("return", {
						isUpdatable: isUpdatableResult.rows[0].is_updatable === "YES",
						tablesUsed: tablesResult.rows.map(function (row) {
							return row.table_name;
						})
					});

				case 13:
				case "end":
					return context$1$0.stop();
			}
		}, null, this);
	},

	/**
  * Create a trigger to send NOTIFY on any change with payload of table name
  * @param  Object client  node-postgres client
  * @param  String table   Name of table to install trigger
  * @param  String channel NOTIFY channel
  * @return Promise true   Successful
  */
	createTableTrigger: function createTableTrigger(client, table, channel) {
		var triggerName, payloadTpl, payloadNew, payloadOld, payloadChanged;
		return _regeneratorRuntime.async(function createTableTrigger$(context$1$0) {
			while (1) switch (context$1$0.prev = context$1$0.next) {
				case 0:
					triggerName = "" + channel + "_" + table;
					payloadTpl = "\n\t\t\tSELECT\n\t\t\t\t'" + table + "'  AS table,\n\t\t\t\tTG_OP       AS op,\n\t\t\t\tjson_agg($ROW$) AS data\n\t\t\tINTO row_data;\n\t\t";
					payloadNew = payloadTpl.replace(/\$ROW\$/g, "NEW");
					payloadOld = payloadTpl.replace(/\$ROW\$/g, "OLD");
					payloadChanged = "\n\t\t\tSELECT\n\t\t\t\t'" + table + "'  AS table,\n\t\t\t\tTG_OP       AS op,\n\t\t\t\tjson_agg(NEW) AS new_data,\n\t\t\t\tjson_agg(OLD) AS old_data\n\t\t\tINTO row_data;\n\t\t";
					context$1$0.next = 7;
					return exports.performQuery(client, "CREATE OR REPLACE FUNCTION " + triggerName + "() RETURNS trigger AS $$\n\t\t\t\tDECLARE\n          row_data RECORD;\n        BEGIN\n          IF (TG_OP = 'INSERT') THEN\n            " + payloadNew + "\n          ELSIF (TG_OP  = 'DELETE') THEN\n            " + payloadOld + "\n          ELSIF (TG_OP = 'UPDATE') THEN\n            " + payloadChanged + "\n          END IF;\n          PERFORM pg_notify('" + channel + "', row_to_json(row_data)::TEXT);\n          RETURN NULL;\n\t\t\t\tEND;\n\t\t\t$$ LANGUAGE plpgsql");

				case 7:
					context$1$0.next = 9;
					return exports.performQuery(client, "DROP TRIGGER IF EXISTS \"" + triggerName + "\"\n\t\t\t\tON \"" + table + "\"");

				case 9:
					context$1$0.next = 11;
					return exports.performQuery(client, "CREATE TRIGGER \"" + triggerName + "\"\n\t\t\t\tAFTER INSERT OR UPDATE OR DELETE ON \"" + table + "\"\n\t\t\t\tFOR EACH ROW EXECUTE PROCEDURE " + triggerName + "()");

				case 11:
					return context$1$0.abrupt("return", true);

				case 12:
				case "end":
					return context$1$0.stop();
			}
		}, null, this);
	},

	/**
  * Drop matching function and trigger for a table
  * @param  Object client  node-postgres client
  * @param  String table   Name of table to remove trigger
  * @param  String channel NOTIFY channel
  * @return Promise true   Successful
  */
	dropTableTrigger: function dropTableTrigger(client, table, channel) {
		var triggerName;
		return _regeneratorRuntime.async(function dropTableTrigger$(context$1$0) {
			while (1) switch (context$1$0.prev = context$1$0.next) {
				case 0:
					triggerName = "" + channel + "_" + table;
					context$1$0.next = 3;
					return exports.performQuery(client, "DROP TRIGGER IF EXISTS " + triggerName + " ON " + table);

				case 3:
					context$1$0.next = 5;
					return exports.performQuery(client, "DROP FUNCTION IF EXISTS " + triggerName + "()");

				case 5:
					return context$1$0.abrupt("return", true);

				case 6:
				case "end":
					return context$1$0.stop();
			}
		}, null, this);
	},

	/**
  * Perform SELECT query, obtaining difference in result set
  * @param  Object  client      node-postgres client
  * @param  Array   currentData Last known result set for this query/params
  * @param  String  query       SQL SELECT statement
  * @param  Array   params      Optionally, pass an array of parameters
  * @return Promise Object      Enumeration of differences
  */
	getResultSetDiff: function getResultSetDiff(client, currentData, query, params) {
		var oldHashes, result, curHashes, newHashes, curHashes2, addedRows, movedHashes, removedHashes, copiedHashes, diff;
		return _regeneratorRuntime.async(function getResultSetDiff$(context$1$0) {
			while (1) switch (context$1$0.prev = context$1$0.next) {
				case 0:
					oldHashes = currentData.map(function (row) {
						return row._hash;
					});
					context$1$0.next = 3;
					return exports.performQuery(client, "\n\t\t\tWITH\n\t\t\t\tres AS (" + query + "),\n\t\t\t\tdata AS (\n\t\t\t\t\tSELECT\n\t\t\t\t\t\tMD5(CAST(ROW_TO_JSON(res.*) AS TEXT)) AS _hash,\n\t\t\t\t\t\tROW_NUMBER() OVER () AS _index,\n\t\t\t\t\t\tres.*\n\t\t\t\t\tFROM res),\n\t\t\t\tdata2 AS (\n\t\t\t\t\tSELECT\n\t\t\t\t\t\t1 AS _added,\n\t\t\t\t\t\tdata.*\n\t\t\t\t\tFROM data\n\t\t\t\t\tWHERE _hash NOT IN ('" + oldHashes.join("','") + "'))\n\t\t\tSELECT\n\t\t\t\tdata2.*,\n\t\t\t\tdata._hash AS _hash\n\t\t\tFROM data\n\t\t\tLEFT JOIN data2\n\t\t\t\tON (data._index = data2._index)", params);

				case 3:
					result = context$1$0.sent;
					curHashes = result.rows.map(function (row) {
						return row._hash;
					});
					newHashes = curHashes.filter(function (hash) {
						return oldHashes.indexOf(hash) === -1;
					});
					curHashes2 = curHashes.slice();
					addedRows = result.rows.filter(function (row) {
						return row._added === 1;
					}).map(function (row) {
						// Prepare row meta-data
						row._index = curHashes2.indexOf(row._hash) + 1;
						delete row._added;

						// Clear this hash so that duplicate hashes can move forward
						curHashes2[row._index - 1] = undefined;

						return row;
					});
					movedHashes = curHashes.map(function (hash, newIndex) {
						var oldIndex = oldHashes.indexOf(hash);

						if (oldIndex !== -1 && oldIndex !== newIndex && curHashes[oldIndex] !== hash) {
							return {
								old_index: oldIndex + 1,
								new_index: newIndex + 1,
								_hash: hash
							};
						}
					}).filter(function (moved) {
						return moved !== undefined;
					});
					removedHashes = oldHashes.map(function (_hash, index) {
						return { _hash: _hash, _index: index + 1 };
					}).filter(function (removed) {
						return curHashes[removed._index - 1] !== removed._hash && movedHashes.filter(function (moved) {
							return moved.new_index === removed._index;
						}).length === 0;
					});
					copiedHashes = curHashes.map(function (hash, index) {
						var oldHashIndex = oldHashes.indexOf(hash);
						if (oldHashIndex !== -1 && oldHashes[index] !== hash && movedHashes.filter(function (moved) {
							return moved.new_index - 1 === index;
						}).length === 0 && addedRows.filter(function (added) {
							return added._index - 1 === index;
						}).length === 0) {
							return {
								new_index: index + 1,
								orig_index: oldHashIndex + 1
							};
						}
					}).filter(function (copied) {
						return copied !== undefined;
					});
					diff = {
						removed: removedHashes.length !== 0 ? removedHashes : null,
						moved: movedHashes.length !== 0 ? movedHashes : null,
						copied: copiedHashes.length !== 0 ? copiedHashes : null,
						added: addedRows.length !== 0 ? addedRows : null
					};

					if (!(diff.added === null && diff.moved === null && diff.copied === null && diff.removed === null)) {
						context$1$0.next = 14;
						break;
					}

					return context$1$0.abrupt("return", null);

				case 14:
					return context$1$0.abrupt("return", diff);

				case 15:
				case "end":
					return context$1$0.stop();
			}
		}, null, this);
	},

	/**
  * Apply a diff to a result set
  * @param  Array  data Last known full result set
  * @param  Object diff Output from getResultSetDiff()
  * @return Array       New result set
  */
	applyDiff: function applyDiff(data, diff) {
		var newResults = data.slice();

		diff.removed !== null && diff.removed.forEach(function (removed) {
			return newResults[removed._index - 1] = undefined;
		});

		// Deallocate first to ensure no overwrites
		diff.moved !== null && diff.moved.forEach(function (moved) {
			newResults[moved.old_index - 1] = undefined;
		});

		diff.copied !== null && diff.copied.forEach(function (copied) {
			var copyRow = _.clone(data[copied.orig_index - 1]);
			copyRow._index = copied.new_index;
			newResults[copied.new_index - 1] = copyRow;
		});

		diff.moved !== null && diff.moved.forEach(function (moved) {
			var movingRow = data[moved.old_index - 1];
			movingRow._index = moved.new_index;
			newResults[moved.new_index - 1] = movingRow;
		});

		diff.added !== null && diff.added.forEach(function (added) {
			return newResults[added._index - 1] = added;
		});

		return newResults.filter(function (row) {
			return row !== undefined;
		});
	} };

// Need copy of curHashes so duplicates can be checked off

// Add rows that have already existing hash but in new places