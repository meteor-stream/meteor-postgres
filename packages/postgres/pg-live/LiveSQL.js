"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

var EventEmitter = require("events").EventEmitter;
var _ = require("lodash");
var murmurHash = require("murmurhash-js").murmur3;

var common = require("./common");

// Number of milliseconds between refreshes
var THROTTLE_INTERVAL = 500;

var LiveSQL = (function (_EventEmitter) {
	function LiveSQL(connStr, channel) {
		_classCallCheck(this, LiveSQL);

		this.connStr = connStr;
		this.channel = channel;
		this.notifyHandle = null;
		this.updateInterval = null;
		this.waitingToUpdate = [];
		this.selectBuffer = {};
		this.tablesUsed = {};
		this.queryDetailsCache = {};
		// DEBUG HELPER
		this.refreshCount = 0;

		this.ready = this.init();
	}

	_inherits(LiveSQL, _EventEmitter);

	_createClass(LiveSQL, {
		init: {
			value: function init() {
				var _this = this;

				return _regeneratorRuntime.async(function init$(context$2$0) {
					while (1) switch (context$2$0.prev = context$2$0.next) {
						case 0:
							context$2$0.next = 2;
							return common.getClient(_this.connStr);

						case 2:
							_this.notifyHandle = context$2$0.sent;
							context$2$0.next = 5;
							return common.performQuery(_this.notifyHandle.client, "LISTEN \"" + _this.channel + "\"");

						case 5:

							_this.notifyHandle.client.on("notification", function (info) {
								if (info.channel === _this.channel) {
									try {
										var payload = JSON.parse(info.payload);
									} catch (error) {
										return _this.emit("error", new Error("INVALID_NOTIFICATION " + info.payload));
									}

									if (payload.table in _this.tablesUsed) {
										var _iteratorNormalCompletion = true;
										var _didIteratorError = false;
										var _iteratorError = undefined;

										try {
											for (var _iterator = _core.$for.getIterator(_this.tablesUsed[payload.table]), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
												var queryHash = _step.value;

												var queryBuffer = _this.selectBuffer[queryHash];
												if (queryBuffer.triggers
												// Check for true response from manual trigger
												 && payload.table in queryBuffer.triggers && (payload.op === "UPDATE" ? queryBuffer.triggers[payload.table](payload.new_data[0]) || queryBuffer.triggers[payload.table](payload.old_data[0]) : queryBuffer.triggers[payload.table](payload.data[0])) || queryBuffer.triggers
												// No manual trigger for this table
												 && !(payload.table in queryBuffer.triggers) || !queryBuffer.triggers) {
													_this.waitingToUpdate.push(queryHash);
												}
											}
										} catch (err) {
											_didIteratorError = true;
											_iteratorError = err;
										} finally {
											try {
												if (!_iteratorNormalCompletion && _iterator["return"]) {
													_iterator["return"]();
												}
											} finally {
												if (_didIteratorError) {
													throw _iteratorError;
												}
											}
										}
									}
								}
							});

							_this.updateInterval = setInterval((function () {
								var queriesToUpdate = _.uniq(_this.waitingToUpdate.splice(0, _this.waitingToUpdate.length));
								_this.refreshCount += queriesToUpdate.length;

								var _iteratorNormalCompletion = true;
								var _didIteratorError = false;
								var _iteratorError = undefined;

								try {
									for (var _iterator = _core.$for.getIterator(queriesToUpdate), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
										var queryHash = _step.value;

										_this._updateQuery(queryHash);
									}
								} catch (err) {
									_didIteratorError = true;
									_iteratorError = err;
								} finally {
									try {
										if (!_iteratorNormalCompletion && _iterator["return"]) {
											_iterator["return"]();
										}
									} finally {
										if (_didIteratorError) {
											throw _iteratorError;
										}
									}
								}
							}).bind(_this), THROTTLE_INTERVAL);

						case 7:
						case "end":
							return context$2$0.stop();
					}
				}, null, this);
			}
		},
		select: {
			value: function select(query, params, onUpdate, triggers) {
				var _this = this;

				var queryHash, queryBuffer, pgHandle, queryDetails, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, table, stop;

				return _regeneratorRuntime.async(function select$(context$2$0) {
					while (1) switch (context$2$0.prev = context$2$0.next) {
						case 0:
							// Allow omission of params argument
							if (typeof params === "function" && typeof onUpdate === "undefined") {
								triggers = onUpdate;
								onUpdate = params;
								params = [];
							}

							if (!(typeof query !== "string")) {
								context$2$0.next = 3;
								break;
							}

							throw new Error("QUERY_STRING_MISSING");

						case 3:
							if (params instanceof Array) {
								context$2$0.next = 5;
								break;
							}

							throw new Error("PARAMS_ARRAY_MISMATCH");

						case 5:
							if (!(typeof onUpdate !== "function")) {
								context$2$0.next = 7;
								break;
							}

							throw new Error("UPDATE_FUNCTION_MISSING");

						case 7:
							queryHash = murmurHash(JSON.stringify([query, params]));

							if (!(queryHash in _this.selectBuffer)) {
								context$2$0.next = 14;
								break;
							}

							queryBuffer = _this.selectBuffer[queryHash];

							queryBuffer.handlers.push(onUpdate);

							// Initial results from cache
							onUpdate({ removed: null, moved: null, copied: null, added: queryBuffer.data }, queryBuffer.data);
							context$2$0.next = 60;
							break;

						case 14:
							// Initialize result set cache
							_this.selectBuffer[queryHash] = {
								query: query,
								params: params,
								triggers: triggers,
								data: [],
								handlers: [onUpdate]
							};

							context$2$0.next = 17;
							return common.getClient(_this.connStr);

						case 17:
							pgHandle = context$2$0.sent;
							queryDetails = undefined;

							if (!(query in _this.queryDetailsCache)) {
								context$2$0.next = 23;
								break;
							}

							queryDetails = _this.queryDetailsCache[query];
							context$2$0.next = 27;
							break;

						case 23:
							context$2$0.next = 25;
							return common.getQueryDetails(pgHandle.client, query);

						case 25:
							queryDetails = context$2$0.sent;

							_this.queryDetailsCache[query] = queryDetails;

						case 27:
							_iteratorNormalCompletion = true;
							_didIteratorError = false;
							_iteratorError = undefined;
							context$2$0.prev = 30;
							_iterator = _core.$for.getIterator(queryDetails.tablesUsed);

						case 32:
							if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
								context$2$0.next = 44;
								break;
							}

							table = _step.value;

							if (table in _this.tablesUsed) {
								context$2$0.next = 40;
								break;
							}

							_this.tablesUsed[table] = [queryHash];
							context$2$0.next = 38;
							return common.createTableTrigger(pgHandle.client, table, _this.channel);

						case 38:
							context$2$0.next = 41;
							break;

						case 40:
							if (_this.tablesUsed[table].indexOf(queryHash) === -1) {
								_this.tablesUsed[table].push(queryHash);
							}

						case 41:
							_iteratorNormalCompletion = true;
							context$2$0.next = 32;
							break;

						case 44:
							context$2$0.next = 50;
							break;

						case 46:
							context$2$0.prev = 46;
							context$2$0.t1 = context$2$0["catch"](30);
							_didIteratorError = true;
							_iteratorError = context$2$0.t1;

						case 50:
							context$2$0.prev = 50;
							context$2$0.prev = 51;

							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}

						case 53:
							context$2$0.prev = 53;

							if (!_didIteratorError) {
								context$2$0.next = 56;
								break;
							}

							throw _iteratorError;

						case 56:
							return context$2$0.finish(53);

						case 57:
							return context$2$0.finish(50);

						case 58:

							pgHandle.done();

							_this.waitingToUpdate.push(queryHash);

						case 60:
							stop = (function callee$2$0() {
								var _this2 = this;

								var queryBuffer, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, table;

								return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
									while (1) switch (context$3$0.prev = context$3$0.next) {
										case 0:
											queryBuffer = _this2.selectBuffer[queryHash];

											if (!queryBuffer) {
												context$3$0.next = 25;
												break;
											}

											_.pull(queryBuffer.handlers, onUpdate);

											if (!(queryBuffer.handlers.length === 0)) {
												context$3$0.next = 25;
												break;
											}

											// No more query/params like this, remove from buffers
											delete _this2.selectBuffer[queryHash];
											_.pull(_this2.waitingToUpdate, queryHash);

											_iteratorNormalCompletion2 = true;
											_didIteratorError2 = false;
											_iteratorError2 = undefined;
											context$3$0.prev = 9;
											for (_iterator2 = _core.$for.getIterator(_core.Object.keys(_this2.tablesUsed)); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
												table = _step2.value;

												_.pull(_this2.tablesUsed[table], queryHash);
											}
											context$3$0.next = 17;
											break;

										case 13:
											context$3$0.prev = 13;
											context$3$0.t0 = context$3$0["catch"](9);
											_didIteratorError2 = true;
											_iteratorError2 = context$3$0.t0;

										case 17:
											context$3$0.prev = 17;
											context$3$0.prev = 18;

											if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
												_iterator2["return"]();
											}

										case 20:
											context$3$0.prev = 20;

											if (!_didIteratorError2) {
												context$3$0.next = 23;
												break;
											}

											throw _iteratorError2;

										case 23:
											return context$3$0.finish(20);

										case 24:
											return context$3$0.finish(17);

										case 25:
										case "end":
											return context$3$0.stop();
									}
								}, null, this, [[9, 13, 17, 25], [18,, 20, 24]]);
							}).bind(_this);

							return context$2$0.abrupt("return", { stop: stop });

						case 62:
						case "end":
							return context$2$0.stop();
					}
				}, null, this, [[30, 46, 50, 58], [51,, 53, 57]]);
			}
		},
		_updateQuery: {
			value: function _updateQuery(queryHash) {
				var _this = this;

				var pgHandle, queryBuffer, diff, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, updateHandler;

				return _regeneratorRuntime.async(function _updateQuery$(context$2$0) {
					while (1) switch (context$2$0.prev = context$2$0.next) {
						case 0:
							context$2$0.next = 2;
							return common.getClient(_this.connStr);

						case 2:
							pgHandle = context$2$0.sent;
							queryBuffer = _this.selectBuffer[queryHash];
							context$2$0.next = 6;
							return common.getResultSetDiff(pgHandle.client, queryBuffer.data, queryBuffer.query, queryBuffer.params);

						case 6:
							diff = context$2$0.sent;

							pgHandle.done();

							if (!(diff !== null)) {
								context$2$0.next = 29;
								break;
							}

							queryBuffer.data = common.applyDiff(queryBuffer.data, diff);

							_iteratorNormalCompletion = true;
							_didIteratorError = false;
							_iteratorError = undefined;
							context$2$0.prev = 13;
							for (_iterator = _core.$for.getIterator(queryBuffer.handlers); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
								updateHandler = _step.value;

								updateHandler(filterHashProperties(diff), filterHashProperties(queryBuffer.data));
							}
							context$2$0.next = 21;
							break;

						case 17:
							context$2$0.prev = 17;
							context$2$0.t2 = context$2$0["catch"](13);
							_didIteratorError = true;
							_iteratorError = context$2$0.t2;

						case 21:
							context$2$0.prev = 21;
							context$2$0.prev = 22;

							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}

						case 24:
							context$2$0.prev = 24;

							if (!_didIteratorError) {
								context$2$0.next = 27;
								break;
							}

							throw _iteratorError;

						case 27:
							return context$2$0.finish(24);

						case 28:
							return context$2$0.finish(21);

						case 29:
						case "end":
							return context$2$0.stop();
					}
				}, null, this, [[13, 17, 21, 29], [22,, 24, 28]]);
			}
		},
		cleanup: {
			value: function cleanup() {
				var _this = this;

				var pgHandle, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, table;

				return _regeneratorRuntime.async(function cleanup$(context$2$0) {
					while (1) switch (context$2$0.prev = context$2$0.next) {
						case 0:
							_this.notifyHandle.done();

							clearInterval(_this.updateInterval);

							context$2$0.next = 4;
							return common.getClient(_this.connStr);

						case 4:
							pgHandle = context$2$0.sent;
							_iteratorNormalCompletion = true;
							_didIteratorError = false;
							_iteratorError = undefined;
							context$2$0.prev = 8;
							_iterator = _core.$for.getIterator(_core.Object.keys(_this.tablesUsed));

						case 10:
							if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
								context$2$0.next = 17;
								break;
							}

							table = _step.value;
							context$2$0.next = 14;
							return common.dropTableTrigger(pgHandle.client, table, _this.channel);

						case 14:
							_iteratorNormalCompletion = true;
							context$2$0.next = 10;
							break;

						case 17:
							context$2$0.next = 23;
							break;

						case 19:
							context$2$0.prev = 19;
							context$2$0.t3 = context$2$0["catch"](8);
							_didIteratorError = true;
							_iteratorError = context$2$0.t3;

						case 23:
							context$2$0.prev = 23;
							context$2$0.prev = 24;

							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}

						case 26:
							context$2$0.prev = 26;

							if (!_didIteratorError) {
								context$2$0.next = 29;
								break;
							}

							throw _iteratorError;

						case 29:
							return context$2$0.finish(26);

						case 30:
							return context$2$0.finish(23);

						case 31:

							pgHandle.done();

						case 32:
						case "end":
							return context$2$0.stop();
					}
				}, null, this, [[8, 19, 23, 31], [24,, 26, 30]]);
			}
		}
	});

	return LiveSQL;
})(EventEmitter);

module.exports = LiveSQL;

function filterHashProperties(diff) {
	if (diff instanceof Array) {
		return diff.map(function (event) {
			return _.omit(event, "_hash");
		});
	}
	// Otherwise, diff is object with arrays for keys
	_.forOwn(diff, function (rows, key) {
		diff[key] = filterHashProperties(rows);
	});
	return diff;
}