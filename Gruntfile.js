module.exports = function( grunt ){

	var pkg = grunt.file.readJSON('package.json');
	var banner = '/* Sparkart.js v'+ pkg.version +'\n'+
	'   Generated on <%= grunt.template.today("yyyy-mm-dd \'at\' HH:MM:ss") %> */\n\n';

	grunt.initConfig({
		cwd: process.cwd(),
		pkg: pkg,
		templates: {
			build: {
				files: {
					'compiled/templates.js': ['src/templates/**/*.hbs']
				}
			}
		},
		concat: {
			build: {
				options: {
					banner: banner,
					separator: ';'
				},
				src: ['src/sparkart.js','compiled/templates.js'],
				dest: 'sparkart.js'
			}
		},
		uglify: {
			build: {
				options: {
					banner: banner
				},
				files: {
					'sparkart.min.js': 'sparkart.js'
				}
			}
		},
		clean: {
			build: ['compiled']
		},
		regarde: {
			dev: {
				files: ['src/**/*'],
				tasks: ['build']
			}
		}
	});
	
	// The cool way to load Grunt tasks
	// https://github.com/Fauntleroy/relay.js/blob/master/Gruntfile.js
	Object.keys( pkg.devDependencies ).forEach( function( dep ){
		if( dep.substring( 0, 6 ) === 'grunt-' ) grunt.loadNpmTasks( dep );
	});

	grunt.registerMultiTask( 'templates', 'Convert templates into javascript', function(){
		// this is an asynchronous task
		var done = this.async();
		var files = this.files[0];
		var concatenated = 'this.sparkart.Fanclub.templates = {';
		for( var i in files.src ){
			var key = files.src[i].replace( /(:?src\/templates\/)|\.hbs/ig, '' );
			var value = grunt.file.read( files.src[i]);
			value = value.replace( /(['"])/g, '\\$1' ); // we will need these escaped if they exist
			value = value.replace( /[\r\n|\n|\r]/ig, '' );
			concatenated += '"'+ key +'": "'+ value +'"';
			if( i < files.src.length - 1 ) concatenated += ',';
		}
		concatenated += '};';
		grunt.log.write( files.dest );
		grunt.file.write( files.dest, concatenated, { encoding: 'UTF8' });
		done();
	});

	grunt.registerTask( 'build', ['templates:build','concat:build','uglify:build','clean:build'] );

};