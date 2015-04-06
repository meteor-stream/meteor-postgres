"use strict";

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

var util = require("util");
var LiveSQL = require("./LiveSQL");

var CONN_STR = "postgres://meteor:meteor@127.0.0.1/meteor";
var CHANNEL = "ben_test";

var liveDb = new LiveSQL(CONN_STR, CHANNEL);

var liveClassScores = function liveClassScores(liveDb, classId, onUpdate) {
	var assignmentIds = [],
	    studentIds = [];

	// Prepare supporting query
	var support = liveDb.select("SELECT id FROM assignments WHERE class_id = $1", [classId], function (diff, results) {
		assignmentIds = results.map(function (row) {
			return row.id;
		});
	}, { assignments: function (row) {
			return row.class_id === classId;
		} });

	var main = liveDb.select("\n\t\tSELECT\n\t\t\tstudents.name  AS student_name,\n\t\t\tstudents.id    AS student_id,\n\t\t\tassignments.id AS assignment_id,\n\t\t\tscores.id      AS score_id,\n\t\t\tassignments.name,\n\t\t\tassignments.value,\n\t\t\tscores.score\n\t\tFROM\n\t\t\tscores\n\t\tINNER JOIN assignments ON\n\t\t\t(assignments.id = scores.assignment_id)\n\t\tINNER JOIN students ON\n\t\t\t(students.id = scores.student_id)\n\t\tWHERE\n\t\t\tassignments.class_id = $1\n\t\tORDER BY\n\t\t\tscore DESC\n\t", [classId], function (diff, results) {
		// Update student_id cache
		studentIds = results.map(function (row) {
			return row.student_id;
		});
		onUpdate(diff, results);
	}, {
		assignments: function (row) {
			return row.class_id === classId;
		},
		students: function (row) {
			return studentIds.indexOf(row.id) !== -1;
		},
		scores: function (row) {
			return assignmentIds.indexOf(row.assignment_id) !== -1;
		}
	});

	var stop = function stop() {
		return _regeneratorRuntime.async(function stop$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return main;

				case 2:
					context$2$0.next = 4;
					return support;

				case 4:
					context$2$0.t4 = context$2$0.sent;
					context$2$0.sent.stop()(context$2$0.t4).stop();

					assignmentIds = null;
					studentIds = null;

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, null, this);
	};

	return { stop: stop };
};

var scoresHandle = liveClassScores(liveDb, 1, function (diff, rows) {
	console.log(util.inspect(diff, { depth: null }), rows);
});

// Ctrl+C
process.on("SIGINT", function callee$0$0() {
	return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return scoresHandle;

			case 2:
				context$1$0.sent.stop();
				context$1$0.next = 5;
				return liveDb.cleanup();

			case 5:
				process.exit();

			case 6:
			case "end":
				return context$1$0.stop();
		}
	}, null, this);
});