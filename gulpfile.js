//variables
var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean');

//minify assets from the index file
gulp.task('minify-js', function () {
  return gulp.src('src/*.js')
    .pipe(rename(function (path) {
      path.extname = '.min.js';
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});
gulp.task('minify-css', function (){
  return gulp.src('src/timepicker.css')
    .pipe(gulp.dest('dist'));
});

//default task
gulp.task('default', ['minify-js', 'minify-css'], function () {

});