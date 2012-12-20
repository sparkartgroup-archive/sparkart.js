var fs = require('fs');
var path = require('path');

var ENCODING = 'UTF8';
var SOURCE_PATH = '../src';
var TEMPLATES_PATH = SOURCE_PATH +'/templates';
var SAVE_PATH = '../sparkart.js';

// Read all template files
fs.readdir( TEMPLATES_PATH, function( err, files ){

	// Create a string of a js object
	var templates_object_str = '{';

	files.forEach( function( file, i ){
		var name = path.basename( file, '.htm' );
		var contents = fs.readFileSync( path.join( TEMPLATES_PATH ,file ), ENCODING );
		contents = contents.replace( "'", "\'" ); // we will need these escaped if they exist
		contents = contents.replace( /[\r\n|\n|\r]/ig, '' );
		var object_bit = "'"+ name +"': '"+ contents +"'";
		if( i < files.length - 1 ) object_bit +=',';
		templates_object_str += object_bit;
	});

	templates_object_str += '}';

	// Read contents of source version of sparkart.js and insert templates object
	var sparkartjs = fs.readFileSync( SOURCE_PATH +'/sparkart.js', ENCODING );
	sparkartjs = sparkartjs.replace( 'TEMPLATES', templates_object_str );

	// Write compiled file to base level
	fs.writeFile( SAVE_PATH, sparkartjs, ENCODING, function( err ){

		if( err ) console.log('Failed to write file.', err );
		console.log('Successfully generated file.');

	});

});