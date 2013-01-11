var FAKE_API_URL = 'http://fake.sparkart.net';
var FAKE_KEY = 'test';

var customer = {
	id: 1,
	first_name: 'Test',
	last_name: 'User',
	email: 'test@sparkart.com',
	fanclub_id: 1,
	registered: true,
	subscription: {}
};

var mock_responses = {
	register: {
		post: {
			success: {
				status: 'ok',
				customer: customer
			}
		}
	},
	account: {
		get: {
			success: {
				status: 'ok',
				customer: customer
			}
		}
	},
	fanclub: {
		get: {
			success: {
				status: 'ok',
				fanclub: {
					id: 1,
					name: 'Test Fanclub'
				}
			}
		}
	}
};

$.mockjaxSettings = {
	responseTime: 1
};

describe( 'Fanclub', function(){

	var fanclub;

	$.mockjax({
		url: FAKE_API_URL +'/account.json',
		data: {
			key: FAKE_KEY
		},
		status: 200,
		responseText: mock_responses.account.get.success
	});

	$.mockjax({
		url: FAKE_API_URL +'/fanclub.json',
		data: {
			key: FAKE_KEY
		},
		status: 200,
		responseText: mock_responses.fanclub.get.success
	});

	beforeEach( function(){

		$('#test').html('<div class="sparkart fanclub account"></div><div class="sparkart fanclub customer"></div>');

	});

	afterEach( function(){

		$('#test').empty();

	});

	it( 'draws all widgets found on the page', function( done ){

		fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		fanclub.on( 'render', function(){
			var account_contents = $('#test').find('div.sparkart.fanclub.account').html();
			var customer_contents = $('#test').find('div.sparkart.fanclub.customer').html();
			assert( account_contents.length > 0, 'Account widget has markup' );
			assert( customer_contents.length > 0, 'Customer widget has markup' );
			done();
		});
		fanclub.destroy();

	});

	it( 'acquires parameters from defaults and specified options', function(){

		var account_preprocessor = function( data ){ return data; }
		fanclub = new sparkart.Fanclub( FAKE_KEY, {
			api_url: FAKE_API_URL,
			preprocessors: {
				account: account_preprocessor,
			}
		});
		assert( fanclub.parameters.api_url === FAKE_API_URL, 'API URL is as specified' );
		assert( $.inArray( account_preprocessor, fanclub.preprocessors.account ) >= 0, 'Account preprocessor has been added to preprocessors array' );
		fanclub.destroy();

	});

	it( 'gets initial fanclub data', function(){

		fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		fanclub.on( 'load', function(){
			assert( !!fanclub.customer, 'Customer data exists' );
			assert( !!fanclub.name, 'Fanclub data exists' );
		});
		fanclub.destroy();

	});

	describe( 'register', function(){

		it( 'registers a user', function(){

			/*$.mockjax({
				url: FAKE_API_URL +'/register.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.register.post.success
			});*/
			var d = $.Deferred();
			var ajax_stub = sinon.stub( $, 'ajax' ).returns( d.promise() );
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
			fanclub.register({
				first_name: 'Test',
				last_name: 'User',
				birthdate: '01-01-1970',
				email: 'test@sparkart.com',
				password: 'test',
				password_confirmation: 'test',
				accept_terms: true
			});
			assert( ajax_stub.calledOnce );

		});

	});

	describe( 'login', function(){

		it( 'logs a user in', function(){
		});

	});

	describe( 'logout', function(){

		it( 'logs a user out', function(){
		});

	});

	describe( 'draw', function(){

		it( 'draws every widget on the page when none are specified', function(){
		});

		it( 'draws the specified widget', function(){
		});

	});

	describe( 'renderWidget', function(){

		it( 'provides the markup of a widget', function(){
		});

	});

	describe( 'request', function(){

		it( 'requests data from the API', function(){
		});

	});

	describe( 'get', function(){

		it( 'initiates a GET request', function(){
		});

	});

	describe( 'post', function(){

		it( 'initiates a POST request', function(){
		});

	});

	describe( 'bindWidget', function(){

		it( 'binds events to a login widget', function(){
		});

		it( 'binds events to a register widget', function(){
		});

		it( 'binds events to a logout widget', function(){
		});

		it( 'binds events to an account widget', function(){
		});

		it( 'binds events to a password reset widget', function(){
		});

	});

	describe( 'on', function(){

		it( 'binds a single event handler', function(){
		});

	});

	describe( 'trigger', function(){

		it( 'triggers all event handlers for the specified event', function(){
		});

	});

	describe( 'off', function(){

		it( 'removes a single event handler from the specified event', function(){
		});

		it( 'removes all event handlers from the specified event', function(){
		});

	});

});