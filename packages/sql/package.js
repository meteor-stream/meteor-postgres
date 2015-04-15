Package.describe({
  name: 'meteor-steam:postgresql',
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
  'lodash'        :  '3.6.0',
});


Package.onUse(function(api) {
  api.use('underscore');
  api.use('tracker');
  api.use('ddp');
  api.versionsFrom('1.1');
  api.addFiles('collection.js');
  api.export('SQL');
});


Package.onTest(function (api) {
  api.addFiles('collection.js', ['server', 'client']);
  api.export('SQL', ['server', 'client']);
  api.addFiles('collection_tests.js', ['server', 'client']);
});
