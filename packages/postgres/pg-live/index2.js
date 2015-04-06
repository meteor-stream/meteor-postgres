//"use strict";
//
//var CONN_STR = "postgres://meteor:meteor@127.0.0.1/meteor";
//var CHANNEL = "ben_test";
//
//console.log(LiveSQL.LiveSQL); // To show that LiveSQL is avaiable here
//
//// RIGHT NOW NOTHING FROM THIS FILE IS BEING EXPORTED SO IT IS
//// BASICALLY UNUSABLE
//
//var liveDb = new LiveSQL(CONN_STR, CHANNEL);
//
//liveDb.select("\n\tSELECT\n\t\tstudents.name  AS student_name,\n\t\tstudents.id    AS student_id,\n\t\tassignments.id AS assignment_id,\n\t\tscores.id      AS score_id,\n\t\tassignments.name,\n\t\tassignments.value,\n\t\tscores.score\n\tFROM\n\t\tscores\n\tINNER JOIN assignments ON\n\t\t(assignments.id = scores.assignment_id)\n\tINNER JOIN students ON\n\t\t(students.id = scores.student_id)\n\tWHERE\n\t\tassignments.class_id = $1\n\tORDER BY\n\t\tscore DESC\n", [1], function (diff, rows) {
//	console.log(util.inspect(diff, { depth: null }), rows);
//});
//
//// Ctrl+C
//process.on("SIGINT", function () {
//	liveDb.cleanup().then(process.exit);
//});