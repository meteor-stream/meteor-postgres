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
  'pg'  :  '4.3.0'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1');
  api.addFiles('postgres.js');
  api.export('Postgres')
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('meteor-steam:postgres');
  api.addFiles('postgres-tests.js');
});
