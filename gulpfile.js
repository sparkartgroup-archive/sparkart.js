var gulp = require('gulp');
var gulp_browserify = require('gulp-browserify');
var gulp_header = require('gulp-header');
var gulp_rename = require('gulp-rename');
var gulp_uglify = require('gulp-uglify');

var pkg = require('./package.json');

var header = '/* Sparkart.js v'+ pkg.version +'\n'+
	'   Generated on <%= datetime %> */\n\n';

gulp.task( 'compile', function(){
	gulp.src('./src/sparkart.js')
		.pipe( gulp_browserify({
			transform: ['hbsfy'],
			standalone: 'sparkart'
		}))
		.pipe( gulp_header( header, {
			datetime: ( new Date ).toGMTString()
		}))
		.pipe( gulp.dest('./') )
		.pipe( gulp_uglify() )
		.pipe( gulp_rename('sparkart.min.js') )
		.pipe( gulp_header( header, {
			datetime: ( new Date ).toGMTString()
		}))
		.pipe( gulp.dest('./') );
});

gulp.task( 'watch', function(){
	gulp.watch( './src/**/*', ['compile'] );
});

gulp.task( 'default', ['compile', 'watch'] );