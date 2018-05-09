process.env.DEBUG = process.env.DEBUG || 'wndlr:*';
const path = require('path');
const createDebugger = require('debug');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const morgan = require('morgan');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const createWebpackServerConfig = require('./webpack.server.js');
const createWebpackClientConfig = require('./webpack.config.js');

const log = createDebugger('wndlr:gulp');
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || '3001';
const syncPort = process.env.SYNC_PORT || '3000';
// make sure sync ui port does not interfere with proxy port
const proxyPort = process.env.SYNC_UI_PORT || parseInt(syncPort, 10) + 2;

const sync = browserSync.create('wndlr-sync-server');
const webpackServerConfig = createWebpackServerConfig({
  production: process.env.NODE_ENV === 'production',
});
log.enabled = true;

const errorNotifier = notify.onError({
  title: 'Compile Error',
  message: '<%= error %>',
});

function errorHandler(err) {
  // Send error to notification center with gulp-notify
  errorNotifier.call(this, err);
  console.error(err);
  // Keep gulp from hanging on this task
  this.emit('end');
}

const paths = {
  watch: [ '.env' ],
  server: {
    buildFiles: [
      'src/server/**/*.js',
      // we ignore this becuase it is handled by webpack
      '!src/server/common-to-server.js',
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
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: [ [
          path.join(__dirname, '/.babelrc.js'),
          { client: false },
        ] ],
      }),
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dist + '/server')),
);

gulp.task('bundle:server:client', () =>
  gulp
    .src(webpackServerConfig.entry)
    .pipe(plumber({ errorHandler }))
    .pipe(
      webpackStream(
        {
          ...webpackServerConfig,
          stats: {
            errors: true,
            warnings: false,
          },
        },
        webpack,
      ),
    )
    .pipe(gulp.dest(webpackServerConfig.output.path)),
);

gulp.task('watch:server', [
  'build:server',
  'bundle:server:client',
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
      PROXY_PORT: syncPort,
      DEBUG: process.env.DEBUG || 'wndlr:*',
      NODE_ENV: 'development',
    },
    delay: '500',
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
  'watch:bundle:dev-server',
  [
    'build:server',
    'bundle:server:client',
    'watch:server',
  ],
  done => {
    const webpackConfig = createWebpackClientConfig({ client: true });
    const compiler = webpack(webpackConfig);
    sync.init(
      {
        ui: { port: proxyPort },
        proxy: {
          target: `http://${host}:${port}`,
          reqHeaders: ({ url: { hostname } }) => ({
            host: `${hostname}:${syncPort}`,
          }),
        },
        logLevel: 'info',
        port: syncPort,
        open: false,
        middleware: [
          morgan('dev'),
          webpackHotMiddleware(compiler, {
            log: createDebugger('wndlr:gulp:watch:dev-server'),
          }),
          webpackDevMiddleware(compiler, {
            publicPath: webpackConfig.output.publicPath,
            stats: 'errors-only',
            heartbeat: 10 * 1000,
          }),
        ],
      },
      done,
    );
    compiler.hooks.done.tap('Browsersync-notify', () =>
      sync.notify('webpack build compiled'),
    );
  },
);

gulp.task(
  'watch',
  [
    'build:server',
    'bundle:server:client',
    'watch:server',
    'watch:bundle:dev-server',
  ],
  () => {
    gulp.watch([
      ...paths.server.buildFiles,
      ...paths.watch,
    ], [ 'build:server' ]);
    gulp.watch(
      [
        ...paths.server.client.watch,
        ...paths.watch,
      ],
      [ 'bundle:server:client' ],
    );
  },
);

gulp.task('default', [
  'build:server',
  'bundle:server:client',
  'watch:server',
  'watch:bundle:dev-server',
  'watch',
]);
