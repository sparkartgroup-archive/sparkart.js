module.exports = function( grunt ){

	var pkg = grunt.file.readJSON('package.json');

	grunt.initConfig({
		cwd: process.cwd(),
		pkg: pkg,
		handlebars: {
			build: {
				options: {
					namespace: 'sparkart.Fanclub.templates',
					wrapped: true,
					processName: function( filename ){
						filename = filename.replace( /^src\/templates\//i, '' );
						filename = filename.replace( /\.hbs$/i, '' );
						return filename;
					}
				},
				files: {
					'compiled/templates.js': ['src/templates/**/*.hbs']
				}
			}
		},
		concat: {
			build: {
				options: {
					separator: ';'
				},
				src: ['src/sparkart.js','compiled/templates.js'],
				dest: 'sparkart.js'
			}
		},
		uglify: {
			build: {
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

	grunt.registerTask( 'server', 'Start the Solidus server', function(){
		var child_process = require('child_process');
		var spawn = child_process.spawn;
		var server = spawn( 'solidus', ['start'] );
		console.log('Starting Solidus server...');
		server.stderr.on( 'data', function( data ){
			console.error( data.toString() );
		});
		server.stdout.on( 'data', function( data ){
			console.log( data.toString() );
		});
		process.on( 'exit', function(){
			server.kill();
		});
	});

	grunt.registerTask( 'build', ['handlebars:build','concat:build','uglify:build','clean:build'] );

};