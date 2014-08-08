'use strict';

var gulp = require('gulp'),
  path = require('path'),
  nutil = require('util'),
  combine = require('stream-combiner'),
  pkg = require('./package.json'),
  chalk = require('chalk'),
  fs = require('fs'),
  concat = require('gulp-concat-util'),
  runSequence = require('run-sequence'),
  src = {
    cwd: 'src',
    dist: 'dist_temp',
    scripts: '*/*.js',
    less: ['modules.less'],
    index: 'module.js',
    templates: '*/*.tpl.html',
    docView: '*/docs/*.view.html',
    html: ['src/**/*.html', 'docs/**/*.html'],
    js: ['src/**/*.js', 'docs/**/*.js', '!src/**/test/*.*'],
    watch: ['src/**/*.*','!src/**/docs/*.*', '!src/**/test/*.*']
  },
  banner,
  createModuleName;

require('matchdep')
  .filterDev('gulp-*')
  .forEach(function(module) {
    global[module.replace(/^gulp-/, '')] = require(module);
  });

banner = util.template('/**\n' +
  ' * <%= pkg.name %>\n' +
  ' * @version v<%= pkg.version %> - <%= today %>\n' +
  ' * @link <%= pkg.homepage %>\n' +
  ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)\n' +
  ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
  ' */\n', {file: '', pkg: pkg, today: new Date().toISOString().substr(0, 10)});

// ========== CLEAN ========== //
gulp.task('clean:dist', function() {
  return gulp.src([src.dist + '/*'], {read: false})
    .pipe(clean())
    .on('error', util.log);
});

// ========== SCRIPTS ========== //
gulp.task('scripts:dist', function(foo) {
  // Build unified package
  return gulp.src([src.index, src.scripts], {cwd: src.cwd})
    .pipe(ngmin())
    .on('error', nutil.log)
    .pipe(concat(pkg.name + '.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .on('error', nutil.log)
    .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
    .on('error', nutil.log)
    .pipe(concat.footer('\n})(window, document);\n'))
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(rename(function(path) { path.extname = '.min.js'; }))
    .on('error', nutil.log)
    .pipe(uglify())
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log);
});

// ========== TEMPLATES ========== //
createModuleName = function(src) { return 'adaptv.adaptStrap.' + src.split(path.sep)[0]; };
gulp.task('templates:dist', function() {
  return gulp.src(src.templates, {cwd: src.cwd})
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
    .on('error', nutil.log)
    .pipe(ngtemplate({module: createModuleName}))
    .on('error', nutil.log)
    .pipe(ngmin())
    .on('error', nutil.log)
    .pipe(concat(pkg.name + '.tpl.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .on('error', nutil.log)
    .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n\n'))
    .on('error', nutil.log)
    .pipe(concat.footer('\n\n})(window, document);\n'))
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(rename(function(path) { path.extname = '.min.js'; }))
    .on('error', nutil.log)
    .pipe(uglify())
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log);
});

// ========== STYLE ========== //
gulp.task('less', function () {
  return gulp.src(paths.mainLess)
    .pipe(less())
    .on('error', nutil.log)
    .pipe(gulp.dest('app'))
    .on('error', nutil.log)
    .pipe(connect.reload())
    .on('error', nutil.log);
});

gulp.task('style:dist', function() {
  return gulp.src(src.less, {cwd: src.cwd})
    .pipe(less())
    .on('error', nutil.log)
    .pipe(concat(pkg.name + '.css', {process: function(src) { return '/* Style: ' + path.basename(this.path) + '*/\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(cssmin())
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(rename({suffix: '.min'}))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .on('error', function(err) {
      util.log(chalk.red(nutil.format('Plugin error: %s', err.message)));
    });
});

gulp.task('style:dist:live', function() {
  return gulp.src(src.less, {cwd: src.cwd})
    .pipe(less())
    .on('error', nutil.log)
    .pipe(concat(pkg.name + '.css', {process: function(src) { return '/* Style: ' + path.basename(this.path) + '*/\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(cssmin())
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(rename({suffix: '.min'}))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(connect.reload())
    .on('error', nutil.log)
});

// ========== validate ========== //
gulp.task('htmlhint', function () {
  return gulp.src(src.html)
    .pipe(htmlhint({
      htmlhintrc: '.htmlhintrc'
    }))
    .pipe(htmlhint.reporter());
});

gulp.task('htmlhint:fail', function () {
  return gulp.src(src.html)
    .pipe(htmlhint({
      htmlhintrc: '.htmlhintrc'
    }))
    .pipe(htmlhint.failReporter());
});

gulp.task('jshint', function() {
  return gulp.src(src.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jshint:fail', function() {
  return gulp.src(src.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function () {
  return gulp.src(src.js)
    .pipe(jscs());
});

gulp.task('unit', function() {
  return gulp.src('./nothing')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});

// ========== DEFAULT TASKS ========== //
gulp.task('dist', function(callback) {
  return runSequence(['jshint:fail', 'htmlhint:fail', 'jscs'],'clean:dist', ['templates:dist', 'scripts:dist', 'style:dist'], callback);
});

gulp.task('dist:release', function(callback) {
  src.dist = 'dist';
  return runSequence(['jshint:fail', 'htmlhint:fail', 'jscs'],'clean:dist', ['templates:dist', 'scripts:dist', 'style:dist'], callback);
});


gulp.task('dist:unsafe', function(callback) {
  runSequence('clean:dist', ['templates:dist', 'scripts:dist', 'style:dist:live'], callback);
  return 0;
});

gulp.task('watch', function () {
  return gulp.watch(src.watch, ['dist:unsafe'])
    .on('error', util.log);
});

gulp.task('server', function () {
  return connect.server({
    root: '',
    port: 9003,
    livereload: true
  });
});

gulp.task('validate', ['jshint', 'jscs', 'htmlhint']);
gulp.task('validate:fail', ['jscs', 'jshint:fail', 'htmlhint:fail']);

gulp.task('default', function(callback) {
  return runSequence('server','dist:unsafe', 'watch', callback);
});