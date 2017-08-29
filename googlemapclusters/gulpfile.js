var gulp = require('gulp');
var $    = require('gulp-load-plugins')();
var babel = require("gulp-babel");

var sassPaths = [
  'bower_components/normalize.scss/sass',
  'bower_components/foundation-sites/scss',
  'bower_components/motion-ui/src'
];

const src = {
  js: 'js'
}

gulp.task('sass', function() {
  return gulp.src('scss/app.scss')
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'nested' // if css compressed **file size**
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('css'));
});

gulp.task('default', ['sass', 'scripts'], function() {
  gulp.watch(['scss/**/*.scss'], ['sass']);
});

gulp.task('scripts', () => gulp
  // Select files
  .src(`${src.js}/app.js`)
  // Concatenate includes
  // .pipe($.include())
  // Transpile
  .pipe(babel())
  // Save unminified file
  // .pipe(gulp.dest(`${dist.js}`))
  // Optimize and minify
  // .pipe(uglify())
  // Append suffix
  // .pipe(rename({
  //   suffix: '.min',
  // }))
  // Save minified file
  .pipe(gulp.dest(`${src.js}/bundled`))
);