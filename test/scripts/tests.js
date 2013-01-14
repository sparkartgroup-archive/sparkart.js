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
			},
			error: {
				status: 'error',
				errors: []
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
	},
	events: {
		get: {
			success: {
				status: 'ok',
				events: [{
					date: '2013-02-10T00:00:00-0500',
					description: '',
					doors_open: null,
					id: 2,
					links: null,
					start: null,
					timezone: 'America/New_York',
					title: '',
					venue: {}
				}]
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
			/*var d = $.Deferred();
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
			assert( ajax_stub.calledOnce );*/

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

		beforeEach( function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });

		});

		afterEach( function(){

			fanclub.destroy();

		});

		it( 'draws every widget on the page when none are specified', function( done ){

			$('#test').append('<div class="sparkart fanclub account"></div><div class="sparkart fanclub customer"></div>');

			fanclub.on( 'render', function(){
				var account_contents = $('#test div.sparkart.fanclub.account').html();
				var customer_contents = $('#test div.sparkart.fanclub.customer').html();
				assert( account_contents.length > 0, 'Account widget has markup' );
				assert( customer_contents.length > 0, 'Customer widget has markup' );
				done();
			});

		});

		it( 'draws the specified widget', function( done ){

			var $logout = $('<div class="sparkart fanclub logout"></div>');
			$('#test').append( $logout );
			fanclub.draw( $logout, function(){
				var logout_contents = $('#test div.sparkart.fanclub.logout').html();
				assert( logout_contents.length > 0, 'Logout widget has markup' );
				done();
			});

		});

	});

	describe( 'renderWidget', function(){

		var account_mock;

		before( function(){

			account_mock = $.mockjax({
				url: FAKE_API_URL +'/account.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.account.get.success
			});

		});
		describe( 'account widgets when logged in', function(){

			it( 'does not render the login widget', function( done ){

				fanclub.renderWidget( 'login', {}, function( err, html ){
					assert( html === '', 'HTML is blank' );
					done();
				});

			});

			it( 'renders the account widget', function( done ){

				fanclub.renderWidget( 'account', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

			it( 'renders the customer widget', function( done ){

				fanclub.renderWidget( 'customer', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

			it( 'renders the logout widget', function( done ){

				fanclub.renderWidget( 'logout', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

		});
		after( function(){

			$.mockjaxClear( account_mock );

		});

		before( function(){

			account_mock = $.mockjax({
				url: FAKE_API_URL +'/account.json',
				data: {
					key: FAKE_KEY
				},
				status: 422,
				responseText: mock_responses.account.get.error
			});

		});
		describe( 'account widgets when logged out', function(){

			it( 'renders the login widget', function( done ){

				fanclub.renderWidget( 'login', {}, function( err, html ){
					assert( html === '', 'HTML is blank' );
					done();
				});

			});

			it( 'does not render the account widget', function( done ){

				fanclub.renderWidget( 'account', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

			it( 'does not render the customer widget', function( done ){

				fanclub.renderWidget( 'customer', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

			it( 'does not render the logout widget', function( done ){

				fanclub.renderWidget( 'logout', {}, function( err, html ){
					assert( html !== '', 'HTML is not blank' );
					done();
				});

			});

		});
		after( function(){

			$.mockjaxClear( account_mock );

		});

		before( function(){

			$.mockjax({
				url: FAKE_API_URL +'/events.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.events.get.success
			});

		});
		describe( 'normal widgets', function(){

			it( 'renders the widget if request is successful', function( done ){

				fanclub.renderWidget( 'events', {}, function( err, html ){
					assert( !!html, 'HTML is not blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does not render if the request fails', function( done ){

				fanclub.renderWidget( 'plans', {}, function( err, html ){
					assert( !html, 'HTML is blank' );
					done();
				})

			});

		});
		after( function(){

			$.mockjaxClear( account_mock );

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