Package.describe({
  name: 'meteorsteam:meteor-postgres',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: 'PostgreSQL support for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/meteor-stream/meteor-postgres',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'pg'            :  '4.3.0'
});

Package.onUse(function(api) {
  // The order these files are imported is very important
  api.versionsFrom('1.1.0.1');
  api.use('underscore');
  api.use('tracker');
  api.use('ddp');

  // minisql
  api.addFiles(['minisql/alasql.js', 'minisql/alasql.js.map', 'minisql/minisql.js'], 'client');
  api.export('miniSQL', 'client');

  api.addFiles('postgres/activerecord.js', 'server');
  api.export('ActiveRecord', 'server');

  api.addFiles('collection/collection.js');
  api.export('SQL');

});

Package.onTest(function (api) {
  api.versionsFrom('1.1');
  api.use(['spacebars', 'tinytest', 'test-helpers', 'underscore', 'tracker', 'ddp']);
  api.addFiles('postgres/activerecord.js', 'server');
  api.export('ActiveRecord', 'server');
  api.addFiles('collection/collection.js', ['server', 'client']);
  api.export('SQL', ['server', 'client']);
  api.addFiles('collection/collection_tests.js');
  api.addFiles('postgres/activerecord_tests.js', 'server');
});

