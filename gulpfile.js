process.env.DEBUG = process.env.DEBUG || 'wndlr:*';
const path = require('path');
const createDebugger = require('debug');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const nodemon = require('gulp-nodemon');
const babel = require('gulp-babel');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const createWebpackServerConfig = require('./webpack.server.js');

const port = process.env.PORT || '3000';
const log = createDebugger('wndlr:gulp');
const webpackServerConfig = createWebpackServerConfig({
  production: process.env.NODE_ENV === 'production',
});
log.enabled = true;

const errorNotifier = notify.onError({
  title: 'Compile Error',
  message: '<%= error %>',
});

function errorHandler(...args) {
  // Send error to notification center with gulp-notify
  errorNotifier.apply(this, args);
  // Keep gulp from hanging on this task
  this.emit('end');
}

const paths = {
  server: {
    buildFiles: [
      'src/server/**/*.js',
      // we ignore this becuase it is handled by webpack
      '!src/server/common-to-server.js',
      '.babelrc.js',
      'postcss.config.js',
      'webpack.config.js',
    ],
    script: './dist/server/index.js',
    watch: [ 'dist/server/**/*' ],
    ignore: [
      'dist/common/**/*',
      'dist/server/common-to-server.js',
    ],
    client: {
      watch: [
        'src/common/**/*',
        webpackServerConfig.entry,
      ],
    },
  },
  dist: 'dist',
};

gulp.task('build:server', () =>
  gulp
    .src(paths.server.buildFiles)
    .pipe(plumber({ errorHandler }))
    .pipe(
      babel({
        presets: [ [
          path.join(__dirname, '/.babelrc.js'),
          { client: false },
        ] ],
      }),
    )
    .pipe(gulp.dest(paths.dist + '/server')),
);

gulp.task('build:server:client', () =>
  gulp
    .src(webpackServerConfig.entry)
    .pipe(plumber({ errorHandler }))
    .pipe(webpackStream(webpackServerConfig, webpack))
    .pipe(gulp.dest(webpackServerConfig.output.path)),
);

gulp.task('watch:server', [
  'build:server',
  'build:server:client',
], done => {
  let called = false;
  const monitor = nodemon({
    // attach a devtool inspector to a running server if needed
    exec: 'node --inspect',
    script: paths.server.script,
    watch: paths.server.watch,
    ignore: paths.server.ignore,
    env: {
      PORT: port,
      DEBUG: process.env.DEBUG || 'wndlr:*',
      BABEL_TARGET: 'client',
      NODE_ENV: 'development',
    },
  })
    .on('start', () => {
      if (!called) {
        called = true;
        log('watch:server started');
        // server has started for the first time
        // let gulp know that this task is complete
        done();
      }
    })
    .on('restart', files => {
      if (files) {
        log(`watch:server restarted due to ${files}`);
      }
    });
  // make sure nodemon exits before closing process;
  process.once('SIGINT', () => {
    monitor.once('exit', () => {
      process.exit(0); /* eslint-disable-line */
    });
  });
});

gulp.task(
  'watch',
  [
    'build:server',
    'build:server:client',
    'watch:server',
  ],
  () => {
    gulp.watch(paths.server.buildFiles, [ 'build:server' ]);
    gulp.watch(paths.server.client.watch, [ 'build:server:client' ]);
  },
);

gulp.task('default', [
  'build:server',
  'build:server:client',
  'watch:server',
  'watch',
]);
