Package.describe({
  name: 'meteor-steam:postgres',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'pg'            :  '4.3.0',
  'babel-runtime' :  '5.0.9',
  'lodash'        :  '3.6.0',
  'random-strings':  '0.0.1',
  'murmurhash-js' :  '1.0.0',
  'pg-live-query' :  '0.0.3'
});

Package.onUse(function(api) {
  // The order these files are imported is very important
  api.versionsFrom('1.1');
  api.use('underscore');
  api.use('tracker');
  api.use('ddp');
  api.addFiles('postgres.js', 'server');
  api.export('Postgres', 'server');
  api.addFiles('sqlcollection.js');
  api.export('SQLCollection');
  api.addFiles('activerecord.js', 'server');
  api.export('ActiveRecord', 'server');
});


Package.onTest(function (api) {
  api.versionsFrom('1.1');
  api.use(['spacebars', 'tinytest', 'test-helpers', 'underscore', 'tracker', 'ddp']);
  api.addFiles('postgres.js', 'server');
  api.export('Postgres', 'server');
  api.addFiles('postgres_tests.js', 'server');
  api.addFiles('sqlcollection.js', ['server', 'client']);
  api.export('SQLCollection', ['server', 'client']);
  api.addFiles('sqlcollection_tests.js', ['server', 'client']);
});
