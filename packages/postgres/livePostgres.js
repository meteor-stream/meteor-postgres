/**
 * Created by ppp on 4/6/2015.
 */
// Convert the LiveMysqlSelect object into a cursor

LiveSQL = Npm.require('pg-live-query');
// console.log("===================================================");
// // console.log('select', LiveSQL.prototype.select);
// console.log("===================================================");

LiveSQL.addCursor = function(context){
  context._publishCursor = _publishCursor;
};

_publishCursor = function(sub) {

  // console.log("===================================================");
  // console.log(sub);
  // console.log("===================================================");
  var self = this;
  var initLength;

  sub.onStop(function(){
    self.stop();
  });

  // Send reset message (for code pushes)
  sub._session.send({
    msg: 'added',
    collection: sub._name,
    id: sub._subscriptionId,
    fields: { reset: true }
  });

  self.on('update', function(rows){
    if(sub._ready === false){
      initLength = rows.length;
      if(initLength === 0) sub.ready();
    }
  });

  function selectHandler(eventName, fieldArgument, indexArgument, customAfter){
    // Events from mysql-live-select are the same names as the DDP msg types
    self.on(eventName, function(/* row, [newRow,] index */){
      sub._session.send({
        msg: eventName,
        collection: sub._name,
        id: sub._subscriptionId + ':' + arguments[indexArgument],
        fields: fieldArgument !== null ? arguments[fieldArgument] : undefined
      });
      if(customAfter) customAfter();
    });
  }

  selectHandler('added', 0, 1, function(){
    if(sub._ready === false &&
      self.data.length === initLength - 1){
      sub.ready();
    }
  });
  selectHandler('changed', 1, 2);
  selectHandler('removed', null, 1);
};