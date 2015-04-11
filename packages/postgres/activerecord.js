/**
 * Created by ppp on 4/11/2015.
 */
ActiveRecord = function() {
  this.inputString = '';
  this.table = '';
};
ActiveRecord.prototype.find = function(table, args) {
  this.table = table;
  this.inputString += 'SELECT * FROM ' + this.table + ' WHERE ('+ this.table + '._id ';
  if (typeof args === 'number') {
    this.inputString += '= ' + args + ') LIMIT 1;'
  } else if (Array.isArray(args)) {
    this.inputString += 'IN (' + args.join(',') + '));';
  }
  return this;
};
ActiveRecord.prototype.fetch = function() {
  var input = this.inputString;
  var table = this.table;
  pg.connect(conString, function(err, client, done) {
    if (err){
      console.log(err);
    }
    console.log(input);
    client.query(input, function(error, results) {
      if (error) {
        console.log("error in active record " + table, error);
      } else {
        console.log("results in active record " + table, results.rows);
      }
      done();
    });
  });
};