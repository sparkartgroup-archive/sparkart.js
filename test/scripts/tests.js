var FAKE_API_URL = 'http://fake.sparkart.net';
var FAKE_KEY = 'test';

var mock_responses = {
	account: {
		success: {
			status: 'ok',
			customer: {
				id: 1,
				first_name: 'Test',
				last_name: 'User',
				email: 'test@sparkart.com',
				fanclub_id: 1,
				registered: true,
				subscription: {}
			}
		}
	}
};

describe( 'Fanclub', function(){

	var fanclub;

	$.mockjax({
		url: FAKE_API_URL +'/account.json',
		data: {
			key: FAKE_KEY
		},
		status: 200,
		responseText: mock_responses.account.success
	});
	
	beforeEach( function(){

		fanclub = new sparkart.Fanclub( FAKE_KEY, { api_url: FAKE_API_URL });

	});

	it( 'draws all widgets found on the page', function(){



	});

	it( 'creates a parameters object from defaults and specified options', function(){
	});

	it( 'gets initial fanclub data', function(){
	});

	describe( 'register', function(){

		it( 'registers a user', function(){
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