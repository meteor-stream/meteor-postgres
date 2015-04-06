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
  'murmurhash-js' :  '1.0.0'
});

Package.onUse(function(api) {
  // The order these files are imported is very important
  api.versionsFrom('1.1');
  api.use('underscore');
  api.use('tracker');
  api.use('ddp');
  api.addFiles('pg-live/common.js', 'server');
  api.export('common', 'server');
  api.addFiles('pg-live/LiveSQL.js', 'server');
  api.export('LiveSQL', 'server');
  api.addFiles('pg-live/index2.js', 'server');
  api.addFiles('pg-live/index2.manual.js', 'server');
  api.addFiles('postgres.js', 'server');
  api.export('Postgres', 'server');
  api.addFiles('subscription.js');
  api.export('Subscription');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('underscore');
  api.use('meteor-steam:postgres');
  api.addFiles('postgres-tests.js');
});
