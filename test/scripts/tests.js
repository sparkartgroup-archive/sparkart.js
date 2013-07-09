mocha.setup({
	globals: ['_gaq', '_gat']
});

var FAKE_API_URL = 'http://fake.sparkart.net';
var FAKE_KEY = 'test';

var mixpanel_distinct_id = '13e200179256b-0cfbb4618-6c1b2073-232800-13e20017926407';
var mixpanel = {
	get_distinct_id: function(){
		return mixpanel_distinct_id;
	}
};

var customer = {
	id: 1,
	first_name: 'Test',
	last_name: 'User',
	email: 'test@sparkart.com',
	fanclub_id: 1,
	subscription: {}
};

var mock_responses = {
	setMixpanelDistinctId: {
		post: {
			success: {
				status: 'ok'
			}
		}
	},
	clearMixpanelDistinctId: {
		post: {
			success: {
				status: 'ok'
			}
		}
	},
	account_status_logged_in: {
		get: {
			success: {
				status: 'ok',
				logged_in: true
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
					name: 'Test Fanclub',
					tracking: {
						development: {
							google_analytics: [],
							mixpanel: null
						},
						production: {
							google_analytics: ['UA-123456-1'],
							mixpanel: null
						}
					}
				}
			}
		}
	},
	contests: {
		get: {
			success: {
				status: 'ok',
				contests: [{
					id: 1,
					name: "All Access 2012 Meet & Greet",
					fanclub_id: 1,
					minimum_age: 13
				}]
			},
			error: {
				status: 'error',
				errors: []
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
	},
	plan1: {
		get: {
			success: {
				status: 'ok',
				plan: {
					name: 'Free',
				    class: 'free',
				    description: '',
				    online_benefits: '',
				    duration: null,
				    display_price: 'Free',
				    upgrade_price: null,
				    price: 0,
				    checkout: 'http://services.sparkart.net/consumer/checkout/1',
				    annotations: '',
				    current: false,
				    upgrade: false,
				    renewal: false,
				    available_to_customer: true,
				    package: { }
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
		url: FAKE_API_URL +'/account/status.json',
		status: 200,
		responseText: mock_responses.account_status_logged_in.get.success
	});

	$.mockjax({
		url: FAKE_API_URL +'/account.json',
		data: {
			key: FAKE_KEY
		},
		status: 200,
		responseText: mock_responses.account.get.success
	});

	$.mockjax({
		url: FAKE_API_URL +'/contests.json',
		data: {
			key: FAKE_KEY
		},
		status: 200,
		responseText: mock_responses.fanclub.get.success
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
		fanclub.on( 'load', function(){
			var account_contents = $('#test').find('div.sparkart.fanclub.account').html();
			var customer_contents = $('#test').find('div.sparkart.fanclub.customer').html();
			assert( account_contents.length > 0, 'Account widget has markup' );
			assert( customer_contents.length > 0, 'Customer widget has markup' );
			fanclub.destroy();
			done();
		});

	});

	it( 'fires load event when no widgets are on the page', function( done ){

		$('#test').empty();
		fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		fanclub.on( 'load', function(){
			done();	
		});

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

	it( 'gets initial fanclub data', function( done ){

		fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		fanclub.on( 'load', function(){
			assert( !!fanclub.customer, 'Customer data exists' );
			assert( !!fanclub.name, 'Fanclub data exists' );
			fanclub.destroy();
			done();
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

			fanclub.on( 'load', function(){
				var account_contents = $('#test div.sparkart.fanclub.account').html();
				var customer_contents = $('#test div.sparkart.fanclub.customer').html();
				assert( account_contents.length > 0, 'Account widget has markup' );
				assert( customer_contents.length > 0, 'Customer widget has markup' );
				done();
			});

		});

		it( 'draws the specified widget', function( done ){

			var $contests = $('<div class="sparkart fanclub contests"></div>');
			$('#test').append( $contests );
			fanclub.draw( $contests, function(){
			  var contests_contents = $('#test div.sparkart.fanclub.contests').html();
			 	assert( contests_contents.length > 0, 'Contests widget has markup' );
			  done();
			});

		});

	});

	describe( 'renderWidget', function(){

		var account_mock;

		before( function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
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

		});

		after( function(){

			fanclub.destroy();
			$.mockjaxClear( account_mock );

		});

		before( function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
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

		});
		after( function(){

			fanclub.destroy();
			$.mockjaxClear( account_mock );

		});

		var events_mock;
		var plans_mock;

		before( function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });

			events_mock = $.mockjax({
				url: FAKE_API_URL +'/events.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.events.get.success
			});

			plans_mock = $.mockjax({
				url: FAKE_API_URL +'/plans.json',
				data: {
					key: FAKE_KEY
				},
				status: 422,
				responseText: null
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

			fanclub.destroy();
			$.mockjaxClear( events_mock );
			$.mockjaxClear( plans_mock );

		});

		var plan1_mock;

		before( function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });

			plan1_mock = $.mockjax({
				url: FAKE_API_URL +'/plans/1.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.plan1.get.success
			});

		});

		describe( 'widgets when not logged in', function(){

			it( 'does not render the account widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'account', {}, function( err, html ){
					assert( !html, 'HTML is blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does render the contests widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'contests', {}, function( err, html ){
					assert( !!html, 'HTML is not blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does not render the customer widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'customer', {}, function( err, html ){
					assert( !html, 'HTML is blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does not render the affiliates widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'affiliates', {}, function( err, html ){
					assert( !html, 'HTML is blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does render the events widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'events', {}, function( err, html ){
					assert( !!html, 'HTML is not blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does render the orders widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'orders', {}, function( err, html ){
					assert( !!html, 'HTML is not blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does render the plans widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'plans', {id: '1'}, function( err, html ){
					assert( !!html, 'HTML is not blank' );
					assert( !err, 'There are no errors' );
					done();
				});

			});

			it( 'does not render the subscription widget' , function( done ){

				fanclub.logged_in = false;
				fanclub.renderWidget( 'subscription', {}, function( err, html ){
					assert( !html, 'HTML is blank' );
					done();
				});

			});

		});
		after( function(){

			fanclub.destroy();
			$.mockjaxClear( plan1_mock );

		});


	});

	describe( 'request', function(){

		var events_mock;

		before( function(){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
			events_mock = $.mockjax({
				url: FAKE_API_URL +'/events.json',
				data: {
					key: FAKE_KEY
				},
				status: 200,
				responseText: mock_responses.events.get.success
			});
		});

		it( 'requests data from the API', function( done ){

			fanclub.request( FAKE_API_URL +'/events.json', 'GET', { key: FAKE_KEY }, function( err, data ){
				assert( !!data, 'Data recieved from API' );
				done();
			});

		});

		after( function(){
			fanclub.destroy();
			$.mockjaxClear( events_mock );
		});

	});

	describe( 'get', function(){

		it( 'initiates a GET request', function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
			var request_stub = sinon.stub( fanclub, 'request' );
			fanclub.get( 'events', { key: FAKE_KEY } );
			assert( request_stub.called, 'Request called' );
			fanclub.destroy();

		});

	});

	describe( 'post', function(){

		it( 'initiates a POST request', function(){

			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
			var request_stub = sinon.stub( fanclub, 'request' );
			fanclub.post( 'account', { key: FAKE_KEY } );
			assert( request_stub.called, 'Request called' );
			fanclub.destroy();

		});

	});

	describe( 'bindWidget', function(){

		beforeEach( function(){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		});

		it( 'binds events to an account widget', function(){

			var $account_widget = $('<div class="sparkart fanclub account"></div>');
			fanclub.bindWidget( 'account', $account_widget );
			var account_widget = $account_widget[0];
			var data = $.hasData( account_widget ) && $._data( account_widget );
			assert( data.events.submit.length === 1, 'One submit event is bound' );
			assert( data.events.click.length === 1, 'One submit event is bound' );

		});

		it( 'binds events to a password reset widget', function(){

			var $password_reset_widget = $('<div class="sparkart fanclub password_reset"></div>');
			fanclub.bindWidget( 'password_reset', $password_reset_widget );
			var password_reset_widget = $password_reset_widget[0];
			var data = $.hasData( password_reset_widget ) && $._data( password_reset_widget );
			assert( data.events.submit.length === 1, 'One submit event is bound' );

		});

		it( 'binds events to a plans widget', function(){

			var $plans_widget = $('<div class="sparkart fanclub plans"></div>');
			fanclub.bindWidget( 'plans', $plans_widget );
			var plans_widget = $plans_widget[0];
			var data = $.hasData( plans_widget ) && $._data( plans_widget );
			assert( data.events.click.length === 1, 'One submit event is bound' );

		});

		it( 'binds events to a contest widget', function(){

			var $contest_widget = $('<div class="sparkart fanclub contest"></div>');
			fanclub.bindWidget( 'contest', $contest_widget );
			var contest_widget = $contest_widget[0];
			var data = $.hasData( contest_widget ) && $._data( contest_widget );
			assert( data.events.submit.length === 1, 'One submit event is bound' );

		});

		afterEach( function(){
			fanclub.destroy();
		});

	});

	describe( 'on', function(){

		beforeEach( function(){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		});

		it( 'binds a single event handler', function(){

			var fake_listener = function(){};
			fanclub.on( 'test', fake_listener );
			assert( fanclub._listeners.test[0] === fake_listener, 'Fake listener is in _listeners' );

		});

		afterEach( function(){
			fanclub.destroy();
		});

	});

	describe( 'trigger', function(){

		beforeEach( function(){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		});

		it( 'triggers all event handlers for the specified event', function(){

			var fake_listener = sinon.spy();
			var fake_listener_2 = sinon.spy();
			fanclub.on( 'test', fake_listener );
			fanclub.on( 'test', fake_listener_2 );
			fanclub.trigger('test');
			assert( fake_listener.called, 'Fake listener 1 was called' );
			assert( fake_listener_2.called, 'Fake listener 2 was called' );

		});

		afterEach( function(){
			fanclub.destroy();
		});

	});

	describe( 'off', function(){

		beforeEach( function(){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
		});

		it( 'removes a single event handler from the specified event', function(){

			var fake_listener = function(){};
			fanclub.on( 'test', fake_listener );
			assert( fanclub._listeners.test[0] === fake_listener, 'Fake listener is in _listeners' );
			fanclub.off( 'test', fake_listener );
			assert( $.inArray( fanclub._listeners, fake_listener ) < 0, 'Fake listener is not in _listeners' );

		});

		it( 'removes all event handlers from the specified event', function(){

			var fake_listener = function(){};
			var fake_listener_2 = function(){};
			fanclub.on( 'test', fake_listener );
			fanclub.on( 'test', fake_listener_2 );
			assert( fanclub._listeners.test[0] === fake_listener, 'Fake listener is in _listeners' );
			assert( fanclub._listeners.test[1] === fake_listener_2, 'Fake listener 2 is in _listeners' );
			fanclub.off('test');
			assert( $.inArray( fanclub._listeners, fake_listener ) < 0, 'Fake listener is not in _listeners' );
			assert( $.inArray( fanclub._listeners, fake_listener_2 ) < 0, 'Fake listener 2 is not in _listeners' );

		});

		afterEach( function(){
			fanclub.destroy();
		});

	});

	describe( 'tracking', function(){
		it( 'gets fanclub data with tracking data for production', function( done ){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });
			fanclub.on( 'load', function(){
				assert( !!fanclub.tracking, 'Tracking data exists' );
				assert( (fanclub.tracking.google_analytics.length == 1), 'Correct environment data is set.' );
				assert( (fanclub.tracking.mixpanel === null), 'Correct environment data is set.' );
				fanclub.destroy();
				done();
			});
		});

		it( 'gets fanclub data with tracking data for development', function( done ){
			fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL, environment: 'development' });
			fanclub.on( 'load', function(){
				assert( !!fanclub.tracking, 'Tracking data exists' );
				assert( (fanclub.tracking.google_analytics.length === 0), 'Correct environment data is set.' );
				assert( (fanclub.tracking.mixpanel === null), 'Correct environment data is set.' );
				fanclub.destroy();
				done();
			});
		});

		describe( 'setMixpanelDistinctId', function(){
			afterEach( function(){
				fanclub.destroy();
			});

			$.mockjax({
				url: FAKE_API_URL +'/mixpanel/set_distinct_id.json',
				type: 'POST',
				data: {
					key: FAKE_KEY,
					mixpanel_distinct_id: mixpanel_distinct_id
				},
				status: 200,
				responseText: mock_responses.setMixpanelDistinctId.post.success
			});

			it( 'POSTs the Mixpanel distinct_id to the server', function( done ){

				fanclub = new sparkart.Fanclub( FAKE_KEY, {
					api_url: FAKE_API_URL,
					reload: false
				});

				fanclub.setMixpanelDistinctId( function( err, data ){
					done();
				});

			});
		});

		describe( 'clearMixpanelDistinctId', function(){
			afterEach( function(){
				fanclub.destroy();
			});

			$.mockjax({
				url: FAKE_API_URL +'/mixpanel/clear_distinct_id.json',
				type: 'POST',
				data: {
					key: FAKE_KEY,
				},
				status: 200,
				responseText: mock_responses.clearMixpanelDistinctId.post.success
			});

			it( 'clears the Mixpanel distinct_id from the session', function( done ){

				fanclub = new sparkart.Fanclub( FAKE_KEY, {
					api_url: FAKE_API_URL,
					reload: false
				});

				fanclub.clearMixpanelDistinctId( function( err, data ){
					done();
				});

			});
		});
	});
});