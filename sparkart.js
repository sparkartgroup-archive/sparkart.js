/* Sparkart.js v0.0.0
   Generated on 2013-03-14 at 15:44:48 */

// Add sparkart to the global namespace
this.sparkart = {};

// Execute code inside a closure
(function( $, Handlebars ){

//
// HANDLEBARS HELPERS
////////////////////////////////////////////////////////////////////////////////
//

Handlebars.registerHelper( 'birthdate_selector', function(){

	// create markup for birthdate picker
	var birth_month = '<select name="birth_month">';
	for( var i in MONTHS ) birth_month += '<option value="'+ ( parseInt(i)+1 ) +'">'+ MONTHS[i] +'</option>';
	birth_month +='</select>';

	var birth_day = '<select name="birth_day">';
	var day = 1;
	while( day <= 31 ){
		birth_day += '<option value="'+ day +'">'+ day +'</option>';
		day++;
	}
	birth_day += '</select>';

	var birth_year = '<select name="birth_year">';
	var current_year = new Date().getFullYear();
	var year = current_year - 115;
	while( year <= current_year ){
		birth_year += ( year === current_year - 18 )
			? '<option value="'+ year +'" selected="selected">'+ year +'</option>'
			: '<option value="'+ year +'">'+ year +'</option>';
		year++;
	}
	birth_year += '</select>';

	return birth_month + birth_day + birth_year;

});

//
// PRIVATE VARIABLES AND METHODS
////////////////////////////////////////////////////////////////////////////////
//

	// The API url we will look to by default
	var API_URL = 'https://services.sparkart.net/api/v1/consumer';

	// Constants for use inside convertDate()
	var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

	// Create a date object that's usable in templates
	var convertDate = function( date_string ){

		if( !date_string ) return null;

		var extract_regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})([-\+][0-9]{4})/;
		var date_bits = extract_regex.exec( date_string );
		var year = date_bits[1];
		var month = parseInt( date_bits[2], 10 );
		var day = parseInt( date_bits[3], 10 );
		var day_of_week = new Date( month +'-'+ day +'-'+ year ).getDay();
		var hour = parseInt( date_bits[4], 10 );
		var minute = date_bits[5];
		var second = date_bits[6];
		var timezone_offset = date_bits[7];
		var date_information = {
			year: {
				full: year,
				half: year.substr(2)
			},
			month: {
				number: month,
				text: MONTHS[month-1],
				abbr: MONTHS[month-1].substr( 0, 3 )
			},
			day: {
				number: day,
				text: DAYS[day_of_week],
				abbr: DAYS[day_of_week].substr( 0, 3 )
			},
			hour: {
				half: hour % 12 || 12,
				full: hour
			},
			minute: minute,
			second: second,
			ampm: ( hour / 12 > 1 )? 'AM': 'PM',
			original: date_string
		};

		return date_information;

	};

	// Add a directions object to an address object
	var convertAddress = function( address ){

		var address_encoded_string = encodeURIComponent( address.address +' '+ address.city +', '+ address.state +' '+ address.postalcode +', '+ address.country );
		address.directions = {
			google_maps: 'https://www.google.com/maps?q='+ address_encoded_string,
			yahoo_maps: 'http://maps.yahoo.com/maps_result?addr='+ address_encoded_string,
			mapquest: 'http://www.mapquest.com/?q='+ address_encoded_string,
			bing_maps: 'http://www.bing.com/maps/?q='+ address_encoded_string
		};

		return address;

	};


//
// FANCLUB CONSTRUCTOR
////////////////////////////////////////////////////////////////////////////////
// Builds the fanclub and returns the new fanclub object
//

	var Fanclub = sparkart.Fanclub = function( key, parameters ){

		var fanclub = this;
		fanclub._listeners = {};
		fanclub.key = key;
		parameters = parameters || {};

		// Set the reload options
		if( typeof parameters.reload === 'boolean' ){
			parameters.reload = {
				login: parameters.reload,
				logout: parameters.reload,
				register: parameters.reload,
				password_reset: parameters.password_reset
			};
		}
		var default_parameters = {
			reload: {
				login: true,
				logout: true,
				register: true,
				password_reset: true
			},
			redirect: {},
			api_url: API_URL
		};
		fanclub.parameters = $.extend( default_parameters, parameters );

		// Define default preprocessors
		var preprocessors = fanclub.preprocessors = {
			event: [ function( data ){
				data.event.date = convertDate( data.event.date );
				data.event.doors_open = convertDate( data.event.doors_open );
				data.event.start = convertDate( data.event.start );
				data.event.venue = convertAddress( data.event.venue );
				return data;
			} ],
			events: [ function( data ){
				$( data.events ).each( function( i, event ){
					event.date = convertDate( event.date );
					event.doors_open = convertDate( event.doors_open );
					event.start = convertDate( event.start );
					event.venue = convertAddress( event.venue );
				});
				return data;
			} ],
			register: [ function( data ){

				// determine if we need to show the username field
				if( data.customer ){
					if( data.customer.username === null ) data.customer.username_required = true;
					else data.customer.username_required === false;
				}

				return data;
			} ]
		};
		if( parameters.templates ){
			for( var name in parameters.templates ){
				parameters.templates[name] = Handlebars.compile( parameters.templates[name] );
			}
		}
		var templates = fanclub.templates = $.extend( sparkart.Fanclub.templates, parameters.templates );
		if( parameters.templates ) ;
		if( parameters.preprocessors ){
			for( var key in parameters.preprocessors ){
				var preprocessor = parameters.preprocessors[key];
				if( !preprocessors[key] ) preprocessors[key] = [];
				if( typeof preprocessor === 'function' ) preprocessors[key].push( preprocessor );
				else preprocessors[key].concat( preprocessor );
			}
		}

		// Fetch initial data from the API
		// Draw all widgets
		// Trigger load event
		// NOTE: get this down to a single request instead of 2
		fanclub.get( 'account', function( err, response ){
			fanclub.get( 'fanclub', function( fc_err, fc_response ){
				fanclub.customer = ( response )? response.customer: null;
				fanclub.authentications = ( fc_response )? fc_response.fanclub.authentications: null;
				fanclub.name = ( fc_response )? fc_response.fanclub.name: null;
				// draw all widgets
				fanclub.draw( function(){
					fanclub.trigger('load');
					fanclub.loaded = true;
				});
			});
		});

	};

//
// PUBLIC METHODS
////////////////////////////////////////////////////////////////////////////////
// Any and all methods available publicly
// Many methods rely on and use each other
//

	// register the user
	Fanclub.prototype.register = function( data, callback ){

		var fanclub = this;
		data = data || {};

		this.post( 'account/register', data, function( err, response ){

			if( err ){
				if( callback ) callback( err );
				return;
			}

			if( callback ) callback( null, response );

			fanclub.trigger( 'register', response.customer );
			fanclub.customer = response.customer;
			var redirect = fanclub.parameters.redirect.register || data.redirect
			if( redirect ) window.location = redirect;
			else if( fanclub.parameters.reload.register ) location.reload();

		});

	};

	// log the user in
	Fanclub.prototype.login = function( data, callback ){

		var fanclub = this;
		data = data || {};

		this.post( 'login', data, function( err, response ){

			if( err ){
				if( callback ) callback( err );
				return;
			}

			if( callback ) callback( null, response );

			fanclub.trigger( 'login', response.customer );
			fanclub.customer = response.customer;
			var redirect = fanclub.parameters.redirect.login || data.redirect
			if( redirect ) window.location = redirect;
			else if( fanclub.parameters.reload.login ) location.reload();
			if( !fanclub.parameters.reload.login ) fanclub.draw();

		});

	};

	// log the user out
	Fanclub.prototype.logout = function( data, callback ){

		var fanclub = this;
		data = data || {};

		this.post( 'logout', data, function( err, response ){

			if( err ){
				if( callback ) callback( err );
				return;
			}

			if( callback ) callback( null, response );

			fanclub.trigger('logout');
			delete fanclub.customer;
			var redirect = fanclub.parameters.redirect.logout || data.redirect
			if( redirect ) window.location = redirect;
			else if( fanclub.parameters.reload.logout ) location.reload();
			else fanclub.draw();

		});

	};

	// Draw widgets
	// $widget, config, callback
	Fanclub.prototype.draw = function(){

		var fanclub = this;
		var $widget;
		var config;
		var callback;

		// figure out what our arguments really are
		for( var i in arguments ){
			if( typeof arguments[i] === 'string' || arguments[i] instanceof $ && !$widget ) $widget = arguments[i];
			else if( Object.prototype.toString.call(arguments[i]) === '[object Object]' && !config ) config = arguments[i];
			else if( typeof arguments[i] === 'function' && !callback ) callback = arguments[i];
		}

		// If no widget is specified, loop through all of them
		if( !$widget ){
			var $widgets = $('.sparkart.fanclub');
			var callback_counter = 0;
			$widgets.each( function( i, widget ){
				fanclub.draw( $(widget), config, function(){
					callback_counter++;
					if( callback_counter === $widgets.length && callback ) callback();
				});
			});
			return;
		}

		$widget = $($widget); // make sure it's a jquery object

		// Pull configuration params off of the widget element
		// Merge configuration params into single object
		var data = $widget.data();
		config = config || {};
		config = $.extend( config, data );

		// Figure out which widget this is
		var widget;
		if( $widget.is('.subscriptions') ) widget = 'subscriptions';
		else if( $widget.is('.plans') ) widget = 'plans';
		else if( $widget.is('.events') ) widget = 'events';
		else if( $widget.is('.event') ) widget = 'event';
		else if( $widget.is('.receipt') ) widget = 'receipt';
		else if( $widget.is('.login') ) widget = 'login';
		else if( $widget.is('.logout') ) widget = 'logout';
		else if( $widget.is('.register') ) widget = 'register';
		else if( $widget.is('.account') ) widget = 'account';
		else if( $widget.is('.customer') ) widget = 'customer';
		else if( $widget.is('.password_reset') ) widget = 'password_reset';
		else if( $widget.is('.order') ) widget = 'order';
		else if( $widget.is('.orders') ) widget = 'orders';
		else if( $widget.is('.affiliates') ) widget = 'affiliates';

		$widget
			.removeClass('error')
			.addClass('loading');

		// Bind events to widget markup
		this.bindWidget( widget, $widget );

		// Generate the widget markup and place it in the DOM
		this.renderWidget( widget, config, function( err, html ){
			if( err ){
				$widget
					.removeClass('loading')
					.addClass('error');
				if( callback ) callback( err );
				return;
			}
			$widget
				.html( html )
				.removeClass('loading');
			if( callback ) callback( null, $widget );
			fanclub.trigger( 'render', $widget );
		});

	};

	// Generate a widget's markup
	Fanclub.prototype.renderWidget = function( widget, config, callback ){

		var fanclub = this;

		// Login, Logout, Register, and Affiliates are all special cases that use the "account" endpoint
		if( widget === 'login' || widget === 'logout' || widget === 'register' || widget === 'customer' ){
			this.get( 'account', function( err, response ){

				if( err ) response = {};

				response.parameters = config;

				// run preprocessors
				var preprocessors = fanclub.preprocessors[widget];
				if( preprocessors ){
					$( preprocessors ).each( function( i, preprocessor ){
						response = preprocessor( response );
					});
				}

				if( widget === 'register' ) response.terms_url = fanclub.parameters.api_url +'/terms?key='+ fanclub.key;
				var html = fanclub.templates[widget]( response );

				if( callback ) callback( null, html );

			});

		}

		else if( widget === 'password_reset' ){

			var html = fanclub.templates[widget]({
				token: true
			});

			if( callback ) callback( null, html );

		}

		else {

			// all other widgets use their own endpoints
			this.get( widget, config, function( err, response ){

				if( err ) return callback( err );

				response.parameters = config;

				// run preprocessors
				var preprocessors = fanclub.preprocessors[widget];
				if( preprocessors ){
					$( preprocessors ).each( function( i, preprocessor ){
						response = preprocessor( response );
					});
				}

				if( callback ) callback( null, fanclub.templates[widget]( response ) );

			});

		}

	};

	// General method for doing AJAX requests
	// Lets us custom process errors, set default parameters, etc
	Fanclub.prototype.request = function( url, method, parameters, callback ){

		var dataType = 'json';
		parameters = $.extend( {}, parameters );
		parameters.key = this.key;

		// If this is IE, we'll try using JSONP instead
		if( typeof XDomainRequest !== 'undefined' ){
			parameters._method = method;
			method = 'GET';
			dataType = 'jsonp';
		}

		if( parameters.id ) delete parameters.id;

		// Generate a jQuery AJAX request
		var request = $.ajax({
			url: url,
			type: method,
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			dataType: dataType,
			data: parameters
		});

		// Bind to the AJAX request's deferred events
		request
			.done( function( data ){
				if( callback ){
					if( data.status === 'error' ) callback( data.messages );
					else callback( null, data );
				}
			})
			.fail( function( request ){
				try {
					var responseObj = JSON.parse( request.responseText );
				}
				catch( err ){
					console.error( err );
				}
				var errors = ( responseObj )? responseObj.messages: [];
				if( callback ) callback( errors );
			});

		return request;

	};

	// Shortcut for getting API data
	Fanclub.prototype.get = function( endpoint, parameters, callback ){

		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}

		var fanclub = this;
		parameters = parameters || {};
		if( endpoint === 'event' || endpoint === 'plan' || endpoint === 'order' ) endpoint +='s';

		// If an ID is provided, we're looking up a single resource
		var url = ( parameters.id )
			? fanclub.parameters.api_url +'/'+ endpoint +'/'+ parameters.id +'.json'
			: fanclub.parameters.api_url +'/'+ endpoint +'.json';

		return this.request( url, 'GET', parameters, callback );

	};

	// Shortcut for sending api data
	Fanclub.prototype.post = function( endpoint, parameters, callback ){

		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}
		var fanclub = this;
		var url = fanclub.parameters.api_url +'/'+ endpoint +'.json';

		return this.request( url, 'POST', parameters, callback );

	};

	// Bind DOM events to widgets
	Fanclub.prototype.bindWidget = function( widget, $widget ){

		var fanclub = this;
		var data = $widget.data();

		// Bind all login widgets
		if( widget === 'login' ){

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', 'form.login', function( e ){

				e.preventDefault();

				var $this = $(this);
				data = $.extend( data, {
					email: $this.find('input[name="email"]').val(),
					password: $this.find('input[name="password"]').val()
				});

				$this
					.removeClass('error success')
					.find('div.errors, div.success').hide();

				// deactivate the form
				var $submit = $this.find('button[type="submit"]');
				$submit.prop( 'disabled', true );

				fanclub.login( data, function( errors, response ){

					// reactivate the form
					$submit.prop( 'disabled', false );

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					if( errors ){
						$this.addClass('error');
						var $err = $( fanclub.templates.errors({ errors: errors }) );
						$errors.html( $err ).show();
						return;
					}

					$this.addClass('success');
					var $success = $this.find('div.success');
					$success.show();

				});

			});

			// Bind forgot password subwidget
			// NOTE: should this be moved elsewhere?
			$widget
			.on( 'click.sparkart', 'a[href="#forgot"]', function( e ){

				e.preventDefault();

				var $this = $(this);
				var $login = $this.closest('.sparkart.fanclub.login');
				var $forgot = $login.find('form.forgot');

				$forgot.show();

			})
			.on( 'click.sparkart', 'a[href="#close"]', function( e ){

				e.preventDefault();

				var $this = $(this);
				var $forgot = $this.closest('form.forgot');

				$forgot.hide();

			})
			.on( 'submit.sparkart', 'form.forgot', function( e ){

				e.preventDefault();

				var $this = $(this);
				data = $.extend( data, {
					email: $this.find('input[name="email"]').val()
				});

				$this
					.removeClass('error success')
					.find('div.errors, div.success').hide();

				// deactivate the form
				var $submit = $this.find('button[type="submit"]');
				$submit.prop( 'disabled', true );

				fanclub.post( 'password_reset', data, function( errors, response ){

					// reactivate the form
					$submit.prop( 'disabled', false );

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					if( errors ){
						$this.addClass('error');
						var $err = $( fanclub.templates.errors({ errors: errors }) );
						$errors.html( $err ).show();
						return;
					}

					$this.addClass('success');
					var $success = $this.find('div.success');
					$success.show();

				});

			});

		}

		// Bind all logout widgets
		else if( widget === 'logout' ){

			$widget
			.off( '.sparkart' )
			.on( 'click.sparkart', 'a[href="#logout"]', function( e ){

				e.preventDefault();

				fanclub.logout( data, function( err ){

					if( err ) return console.log( err );

				});

			});

		}

		// Bind all register widgets
		else if( widget === 'register' ){

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', function( e ){

				e.preventDefault();

				var $this = $(this);
				var $birth_day = $this.find('select[name="birth_day"]');
				var $birth_month = $this.find('select[name="birth_month"]');
				var $birth_year = $this.find('select[name="birth_year"]');
				var birthdate = $birth_day.val() +'-'+ $birth_month.val() +'-'+ $birth_year.val();
				data = $.extend( data, {
					username: $this.find('input[name="username"]').val(),
					first_name: $this.find('input[name="first_name"]').val(),
					last_name: $this.find('input[name="last_name"]').val(),
					username: $this.find('input[name="username"]').val(),
					birthdate: birthdate,
					email: $this.find('input[name="email"]').val(),
					password: $this.find('input[name="password"]').val(),
					password_confirmation: $this.find('input[name="password_confirmation"]').val(),
					accept_terms: $this.find('input[name="accept_terms"]').prop('checked')
				});

				$this
					.removeClass('error success')
					.find('div.errors, div.success').hide();

				// deactivate the form
				var $submit = $this.find('button[type="submit"]');
				$submit.prop( 'disabled', true );

				fanclub.register( data, function( errors, response ){

					// reactivate the form
					$submit.prop( 'disabled', false );

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					if( errors ){
						$this.addClass('error');
						var $err = $( fanclub.templates.errors({ errors: errors }) );
						$errors.html( $err ).show();
						return;
					}

					$this.addClass('success');
					var $success = $this.find('div.success');
					$success.show();

				});

			});

		}

		// Bind all account widgets
		else if( widget === 'account' ){

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', function( e ){

				e.preventDefault();

				var $this = $(this);
				data = $.extend( data, {
					username: $this.find('input[name="username"]').val(),
					first_name: $this.find('input[name="first_name"]').val(),
					last_name: $this.find('input[name="last_name"]').val(),
					email: $this.find('input[name="email"]').val(),
					current_password: $this.find('input[name="current_password"]').val(),
					password: $this.find('input[name="password"]').val(),
					password_confirmation: $this.find('input[name="password_confirmation"]').val()
				});

				$this
					.removeClass('error success')
					.find('div.errors, div.success').hide();

				// deactivate the form
				var $submit = $this.find('button[type="submit"]');
				$submit.prop( 'disabled', true );

				fanclub.post( 'account', data, function( errors ){

					// reactivate the form
					$submit.prop( 'disabled', false );

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					if( errors ){
						$this.addClass('error');
						var $err = $( fanclub.templates.errors({ errors: errors }) );
						$errors.html( $err ).show();
						return;
					}

					$this.addClass('success');
					var $success = $this.find('div.success');
					$success.show();

				});

			});

		}

		else if( widget === 'password_reset' ){

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', function( e ){

				e.preventDefault();

				var $this = $(this);
				data = $.extend( data, {
					password: $this.find('input[name="password"]').val(),
					password_confirmation: $this.find('input[name="password_confirmation"]').val()
				});

				// extract password reset key
				var query_bits = location.search.substr(1).split('&');
				var query = {};
				for( var i = query_bits.length - 1; i >= 0; i-- ){
					var bits = query_bits[i].split('=');
					var key = bits[0];
					var value = bits[1];
					query[key] = value;
				};

				$this
					.removeClass('error success')
					.find('div.errors, div.success').hide();

				// deactivate the form
				var $submit = $this.find('button[type="submit"]');
				$submit.prop( 'disabled', true );

				fanclub.post( 'password_reset/'+ query.token, data, function( errors ){

					// reactivate the form
					$submit.prop( 'disabled', false );

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					if( errors ){
						$this.addClass('error');
						var $err = $( fanclub.templates.errors({ errors: errors }) );
						$errors.html( $err ).show();
						return;
					}

					$this.addClass('success');
					var $success = $this.find('div.success');
					$success.show();

					var redirect = fanclub.parameters.redirect.password_reset || data.redirect;
					if( redirect ) window.location = redirect;

				});

			});

		}

	};

/*
EVENT EMITTER METHODS
////////////////////////////////////////////////////////////////////////////////
Methods for binding, triggering, and unbinding events
*/

	// Binds a new listener to an event
	Fanclub.prototype.on = function( type, listener ){

		var fanclub = this;

		if( typeof this._listeners[type] == 'undefined' ){
			this._listeners[type] = [];
		}

		if( typeof listener !== 'function' ) return;

		this._listeners[type].push(listener);

		if( type === 'load' && fanclub.loaded ) listener();

	};

	// Triggers all event listeners on an event
	Fanclub.prototype.trigger = function( event ){

		var event_args = Array.prototype.splice.call( arguments, 1 );

		if( this._listeners[event] instanceof Array ){
			var listeners = this._listeners[event];
			$( listeners ).each( function( i, listener ){
				listener.apply( this, event_args );
			});
		}

	};

	// Removes listeners from an event
	Fanclub.prototype.off = function( type, removed_listener ){

		if( !type && !removed_listener ) this._listeners = {};

		if( this._listeners[type] instanceof Array ){
			var listeners = this._listeners[type];
			if( removed_listener ){
				for( var i = 0; i < listeners.length; i++ ){
					var listener = listeners[i];
					if( listener === removed_listener ){
						listeners.splice( i, 1 );
						break;
					}
				}
			}
			else {
				listeners.splice( 0, listeners.length );
			}
		}

	};

	// Destroy all traces of Sparkart Fanclub
	Fanclub.prototype.destroy = function(){

		this.off();

		$('.sparkart.fanclub')
			.off('.sparkart')
			.empty();

	};

// Pass jQuery and Handlebars to the closure
})( jQuery, Handlebars );
;this["sparkart"] = this["sparkart"] || {};
this["sparkart"]["Fanclub"] = this["sparkart"]["Fanclub"] || {};
this["sparkart"]["Fanclub"]["templates"] = this["sparkart"]["Fanclub"]["templates"] || {};

this["sparkart"]["Fanclub"]["templates"]["account"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack1 = helpers.registered) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.registered; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.registered) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n<form class=\"account\">\n	<div class=\"success\" style=\"display: none;\">\n		<p>Account Successfully Updated!</p>\n	</div>\n	<div class=\"errors\" style=\"display: none;\"></div>\n	<fieldset>\n		<label>Username<br />\n		<input name=\"username\" type=\"text\" value=\"";
  if (stack1 = helpers.username) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.username; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label><br />\n		<label>First Name<br />\n		<input name=\"first_name\" type=\"text\" value=\"";
  if (stack1 = helpers.first_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.first_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label><br />\n		<label>Last Name<br />\n		<input name=\"last_name\" type=\"text\" value=\"";
  if (stack1 = helpers.last_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.last_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label><br />\n		<label>Email Address<br />\n		<input name=\"email\" type=\"text\" value=\"";
  if (stack1 = helpers.email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" /></label><br />\n		<div class=\"password\">\n			<label>Current Password<br />\n			<input name=\"current_password\" type=\"password\" /></label>\n			<hr />\n			<label>New Password<br />\n			<input name=\"password\" type=\"password\" /></label><br />\n			<label>Repeat New Password<br />\n			<input name=\"password_confirmation\" type=\"password\" /></label>\n		</div>\n	</fieldset>\n	<button type=\"submit\">Update Account</button>\n</form>\n";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.customer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.customer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.customer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["affiliates"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n	<h2>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n	<ul class=\"codes\">\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack1 = helpers.codes) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.codes; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.codes) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ul>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "";
  buffer += "<li>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</li>";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.affiliates) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.affiliates; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.affiliates) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["customer"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack1 = helpers.registered) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.registered; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.registered) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n<div class=\"info\">\n	";
  stack1 = helpers['if'].call(depth0, depth0.username, {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};
  if (stack1 = helpers.subscription) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.subscription; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.subscription) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;
  }
function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<strong class=\"username\">";
  if (stack1 = helpers.username) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.username; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n	";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<strong class=\"name\">";
  if (stack1 = helpers.first_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.first_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.last_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.last_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n	";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<span class=\"subscription\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.plan),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</span>\n	";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.customer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.customer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.customer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["errors"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "<li>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</li>";
  return buffer;
  }

  buffer += "<ul class=\"errors\">";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.errors) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.errors; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.errors) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</ul>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["event"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n<div class=\"event\">\n	<h2>"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.date),stack1 == null || stack1 === false ? stack1 : stack1.month)),stack1 == null || stack1 === false ? stack1 : stack1.abbr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.date),stack1 == null || stack1 === false ? stack1 : stack1.day)),stack1 == null || stack1 === false ? stack1 : stack1.number)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h2>\n	<h3>";
  if (stack2 = helpers.title) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.title; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h3>\n	<div class=\"description\">";
  if (stack2 = helpers.description) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.description; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</div>\n	<dl>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack2 = helpers.doors_open) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.doors_open; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.doors_open) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack2 = helpers.start) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.start; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.start) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</dl>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data};
  if (stack2 = helpers.venue) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.venue; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.venue) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	<ul class=\"links\">\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data};
  if (stack2 = helpers.links) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.links; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.links) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</ul>\n</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n		<dt>Doors Open</dt>\n		<dd>"
    + escapeExpression(((stack1 = ((stack1 = depth0.hour),stack1 == null || stack1 === false ? stack1 : stack1.half)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ":";
  if (stack2 = helpers.minute) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.minute; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " <span class=\"ampm\">";
  if (stack2 = helpers.ampm) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ampm; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</span></dd>\n		";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n		<dt>Start</dt>\n		<dd>"
    + escapeExpression(((stack1 = ((stack1 = depth0.hour),stack1 == null || stack1 === false ? stack1 : stack1.half)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + ":";
  if (stack2 = helpers.minute) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.minute; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " <span class=\"ampm\">";
  if (stack2 = helpers.ampm) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.ampm; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</span></dd>\n		";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n	<div class=\"venue\">\n		<h4>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h4>\n		<strong class=\"city\">";
  if (stack1 = helpers.city) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.city; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>, <em class=\"state\">";
  if (stack1 = helpers.state) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</em> <span class=\"country\">";
  if (stack1 = helpers.country) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.country; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n		<h5>Directions</h5>\n		<ul class=\"directions\">\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};
  if (stack1 = helpers.directions) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.directions; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.directions) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</ul>\n	</div>\n	";
  return buffer;
  }
function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<li><a href=\"";
  if (stack1 = helpers.google_maps) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.google_maps; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Google Maps</a></li>\n			<li><a href=\"";
  if (stack1 = helpers.yahoo_maps) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.yahoo_maps; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Yahoo Maps</a></li>\n			<li><a href=\"";
  if (stack1 = helpers.mapquest) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.mapquest; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Mapquest</a></li>\n			<li><a href=\"";
  if (stack1 = helpers.bing_maps) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.bing_maps; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Bing Maps</a></li>\n			";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<li><a href=\"";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n		";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.event) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.event; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.event) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["events"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n	<li>\n		<h2><a href=\""
    + escapeExpression(((stack1 = ((stack1 = depth1.parameters),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.date),stack1 == null || stack1 === false ? stack1 : stack1.month)),stack1 == null || stack1 === false ? stack1 : stack1.abbr)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " "
    + escapeExpression(((stack1 = ((stack1 = ((stack1 = depth0.date),stack1 == null || stack1 === false ? stack1 : stack1.day)),stack1 == null || stack1 === false ? stack1 : stack1.number)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a></h2>\n		<h3>";
  if (stack2 = helpers.title) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.title; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h3>\n		<div class=\"description\">";
  if (stack2 = helpers.description) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.description; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</div>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack2 = helpers.venue) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.venue; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.venue) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		<ul class=\"links\">\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack2 = helpers.links) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.links; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.links) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		</ul>\n	</li>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<div class=\"venue\">\n			<h4>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h4>\n			<strong>";
  if (stack1 = helpers.city) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.city; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>, ";
  if (stack1 = helpers.state) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n		</div>\n		";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<li><a href=\"";
  if (stack1 = helpers.url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></li>\n			";
  return buffer;
  }

  buffer += "<ul class=\"events\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data};
  if (stack1 = helpers.events) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.events; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.events) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["login"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "\n<form class=\"login\">\n	<div class=\"success\" style=\"display: none;\">\n		<p>You have successfully logged in.</p>\n	</div>\n	<div class=\"errors\" style=\"display: none;\"></div>\n	<fieldset>\n		<label>Email<br />\n		<input name=\"email\" type=\"text\" /></label>\n		<label>Password<br />\n		<input name=\"password\" type=\"password\" /></label>\n		<a href=\"#forgot\">Forgot Password?</a>\n	</fieldset>\n	<button type=\"submit\">Log In</button>\n</form>\n<form class=\"forgot\" style=\"display:none\">\n	<a href=\"#close\">Close</a>\n	<div class=\"success\" style=\"display: none;\">\n		<p>A message has been sent to this address. Please check your email for instructions on how to reset your password.</p>\n	</div>\n	<div class=\"errors\" style=\"display: none;\"></div>\n	<fieldset>\n		<p>Please enter the email address you used for your fanclub account:</p>\n		<label>Email<br />\n		<input type=\"text\" name=\"email\"></input>\n	</fieldset>\n	<button type=\"submit\">Submit</button>\n</form>\n";
  }

  options = {hash:{},inverse:self.program(1, program1, data),fn:self.noop,data:data};
  if (stack1 = helpers.customer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.customer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.customer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["logout"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "<a href=\"#logout\">Log Out</a>";
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.customer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.customer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.customer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["order"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n<div class=\"order\">\n	<h4>Order ";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h4>\n	<div class=\"details\">\n		<h5 class=\"name\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.plan),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h5>\n		<span class=\"customer\">Customer ID: <var>";
  if (stack2 = helpers.customer_id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.customer_id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</var></span>\n		<ul class=\"dates\">\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack2 = helpers.paid_at) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.paid_at; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.paid_at) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack2 = helpers.refunded_at) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.refunded_at; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.refunded_at) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n		</ul>\n	</div>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data};
  if (stack2 = helpers.billing_address) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.billing_address; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.billing_address) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	<ul class=\"shipments\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data};
  if (stack2 = helpers.shipments) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.shipments; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.shipments) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</ul>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(20, program20, data),data:data};
  if (stack2 = helpers.totals) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.totals; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.totals) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "";
  buffer += "\n			<li class=\"paid\">Paid <var class=\"date\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var></li>\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "";
  buffer += "\n			<li class=\"refunded\">Refunded <var class=\"refunded\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var></li>\n			";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<div class=\"billing\">\n		<h6>Billed To</h6>\n		<ul class=\"address\">\n			<li class=\"name\">";
  if (stack1 = helpers.first_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.first_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.last_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.last_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n			<li class=\"country\">";
  if (stack1 = helpers.country) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.country; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n			<li class=\"address line1\">";
  if (stack1 = helpers.address) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.address; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n			<li class=\"address line2\">";
  if (stack1 = helpers.city) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.city; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (stack1 = helpers.state) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (stack1 = helpers.postal_code) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.postal_code; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n		</ul>\n	</div>\n	";
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n		<li>\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data};
  if (stack1 = helpers.tracking_number) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.tracking_number; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.tracking_number) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			<div class=\"shipping\">\n				<h6>Shipped To</h6>\n				";
  options = {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data};
  if (stack1 = helpers.shipping_address) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.shipping_address; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.shipping_address) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</div>\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data};
  if (stack1 = helpers.ship_date) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.ship_date; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.ship_date) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			<ul class=\"items\">\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data};
  if (stack1 = helpers.items) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.items; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.items) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n		</li>\n	";
  return buffer;
  }
function program9(depth0,data) {
  
  var buffer = "";
  buffer += "<var class=\"tracking\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var>";
  return buffer;
  }

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<ul class=\"address\">\n					<li class=\"name\">";
  if (stack1 = helpers.first_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.first_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " ";
  if (stack1 = helpers.last_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.last_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n					<li class=\"address line1\">";
  if (stack1 = helpers.address) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.address; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n					<li class=\"address line2\">";
  if (stack1 = helpers.city) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.city; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (stack1 = helpers.state) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (stack1 = helpers.postal_code) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.postal_code; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ", ";
  if (stack1 = helpers.country) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.country; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n				</ul>\n				";
  return buffer;
  }

function program13(depth0,data) {
  
  var buffer = "";
  buffer += "<span class=\"shipped\">Shipped On <var class=\"date\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var></span>";
  return buffer;
  }

function program15(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n				<li>\n					";
  options = {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data};
  if (stack1 = helpers.thumbnail) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.thumbnail; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.thumbnail) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n					<strong class=\"name\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n					";
  options = {hash:{},inverse:self.noop,fn:self.program(18, program18, data),data:data};
  if (stack1 = helpers.option) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.option; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.option) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n				</li>\n			";
  return buffer;
  }
function program16(depth0,data) {
  
  var buffer = "";
  buffer += "<img class=\"thumbnail\" src=\""
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "\" />";
  return buffer;
  }

function program18(depth0,data) {
  
  var buffer = "";
  buffer += "<span class=\"option\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</span>";
  return buffer;
  }

function program20(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n	<dl class=\"totals\">\n		<dt class=\"subtotal\">Subtotal</dt>\n		<dd class=\"subtotal\">$";
  if (stack1 = helpers.subtotal) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.subtotal; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dd>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(21, program21, data),data:data};
  if (stack1 = helpers.shipping) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.shipping; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.shipping) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(23, program23, data),data:data};
  if (stack1 = helpers.discount) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.discount; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.discount) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		<dt class=\"total\">Total</dt>\n		<dd class=\"total\">$";
  if (stack1 = helpers.total) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.total; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dd>\n	</dl>\n	";
  return buffer;
  }
function program21(depth0,data) {
  
  var buffer = "";
  buffer += "\n		<dt class=\"shipping\">Shipping</dt>\n		<dd class=\"shipping\">$"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</dd>\n		";
  return buffer;
  }

function program23(depth0,data) {
  
  var buffer = "";
  buffer += "\n		<dt class=\"discount\">Discount</dt>\n		<dd class=\"discount\">$"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</dd>\n		";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.order) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.order; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.order) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["orders"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data,depth1) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n	<li>\n		<a href=\""
    + escapeExpression(((stack1 = ((stack1 = depth1.parameters),stack1 == null || stack1 === false ? stack1 : stack1.url)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\"><h4>Order ";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</h4></a>\n		<div class=\"details\">\n			<h5 class=\"name\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.plan),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</h5>\n			<span class=\"customer\">Customer ID: <var>";
  if (stack2 = helpers.customer_id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.customer_id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</var></span>\n			<ul class=\"dates\">\n				";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack2 = helpers.paid_at) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.paid_at; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.paid_at) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n				";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack2 = helpers.refunded_at) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.refunded_at; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.refunded_at) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n			</ul>\n		</div>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data};
  if (stack2 = helpers.totals) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.totals; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.totals) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n	</li>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "";
  buffer += "\n				<li class=\"paid\">Paid <var class=\"date\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var></li>\n				";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "";
  buffer += "\n				<li class=\"refunded\">Refunded <var class=\"refunded\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</var></li>\n				";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n		<dl class=\"totals\">\n			<dt class=\"subtotal\">Subtotal</dt>\n			<dd class=\"subtotal\">$";
  if (stack1 = helpers.subtotal) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.subtotal; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dd>\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};
  if (stack1 = helpers.shipping) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.shipping; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.shipping) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data};
  if (stack1 = helpers.discount) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.discount; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.discount) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			<dt class=\"total\">Total</dt>\n			<dd class=\"total\">$";
  if (stack1 = helpers.total) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.total; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</dd>\n		</dl>\n		";
  return buffer;
  }
function program7(depth0,data) {
  
  var buffer = "";
  buffer += "\n			<dt class=\"shipping\">Shipping</dt>\n			<dd class=\"shipping\">$"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</dd>\n			";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "";
  buffer += "\n			<dt class=\"discount\">Discount</dt>\n			<dd class=\"discount\">$"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</dd>\n			";
  return buffer;
  }

  buffer += "<ul class=\"orders\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.programWithDepth(program1, data, depth0),data:data};
  if (stack1 = helpers.orders) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.orders; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.orders) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["password_reset"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "\n<form class=\"password_reset\">\n	<div class=\"success\" style=\"display: none;\">\n		<p>Password Successfully Updated!</p>\n	</div>\n	<div class=\"errors\" style=\"display: none;\"></div>\n	<fieldset>\n		<div class=\"password\">\n			<label>New Password<br />\n			<input name=\"password\" type=\"password\" /></label><br />\n			<label>Repeat New Password<br />\n			<input name=\"password_confirmation\" type=\"password\" /></label>\n		</div>\n	</fieldset>\n	<button type=\"submit\">Update Password</button>\n</form>\n";
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.token) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.token; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.token) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["plan"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n		<h3>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n		<ul class=\"items\">\n			";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack1 = helpers.items) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.items; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.items) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		</ul>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n			<li>\n				<img src=\"";
  if (stack1 = helpers.thumbnail) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.thumbnail; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n				<strong>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n			</li>\n			";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "";
  buffer += "<sub class=\"annotations\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</sub>";
  return buffer;
  }

  buffer += "<div class=\"plan\">\n	<h2>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n	<h3>";
  if (stack1 = helpers.price) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.price; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n	<div class=\"description\">";
  if (stack1 = helpers.description) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.description; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers['package']) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0['package']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers['package']) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	<ul class=\"actions\">\n		<li class=\"join\"><a href=\"";
  if (stack1 = helpers.checkout) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.checkout; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Join Now</a></li>\n	</ul>\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack1 = helpers.annotations) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.annotations; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.annotations) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "	\n</div>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["plans"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n	<li>\n		<h2>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n		<h3>";
  if (stack1 = helpers.price) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.price; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n		<div class=\"description\">";
  if (stack1 = helpers.description) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.description; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};
  if (stack1 = helpers['package']) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0['package']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers['package']) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		<ul class=\"actions\">\n			<li class=\"join\"><a href=\"";
  if (stack1 = helpers.checkout) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.checkout; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">Join Now</a></li>\n		</ul>\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};
  if (stack1 = helpers.annotations) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.annotations; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.annotations) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</li>\n	";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n			<h3>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n			<ul class=\"items\">\n				";
  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};
  if (stack1 = helpers.items) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.items; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.items) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n		";
  return buffer;
  }
function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n				<li>\n					<img src=\"";
  if (stack1 = helpers.thumbnail) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.thumbnail; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" />\n					<strong>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n				</li>\n				";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "";
  buffer += "<sub class=\"annotations\">"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</sub>";
  return buffer;
  }

  buffer += "<ul class=\"plans\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.plans) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.plans; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.plans) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["receipt"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "<li>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>";
  return buffer;
  }

  buffer += "<ul class=\"receipt\">";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.items) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.items; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.items) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</ul>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["register"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var stack1, options, functionType="function", self=this, blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n";
  options = {hash:{},inverse:self.program(2, program2, data),fn:self.noop,data:data};
  if (stack1 = helpers.registered) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.registered; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.registered) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n<form class=\"register\" method=\"PUT\">\n	<div class=\"success\" style=\"display: none;\">\n		<p>You have successfully completed the registration of your fanclub account.</p>\n	</div>\n	<div class=\"errors\" style=\"display: none;\"></div>\n	<fieldset>\n		<p>Complete your fanclub account registration.</p>\n		";
  options = {hash:{},inverse:self.program(3, program3, data),fn:self.noop,data:data};
  if (stack1 = helpers.email) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.email; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.email) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};
  if (stack1 = helpers.username_required) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.username_required; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.username_required) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  options = {hash:{},inverse:self.program(7, program7, data),fn:self.noop,data:data};
  if (stack1 = helpers.first_name) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.first_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.first_name) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  options = {hash:{},inverse:self.program(9, program9, data),fn:self.noop,data:data};
  if (stack1 = helpers.last_name) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.last_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.last_name) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  options = {hash:{},inverse:self.program(11, program11, data),fn:self.noop,data:data};
  if (stack1 = helpers.birthdate) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.birthdate; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.birthdate) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		<label>Password<br />\n		<input name=\"password\" type=\"password\" /></label>\n		<label>Password Confirm<br />\n		<input name=\"password_confirmation\" type=\"password\" /></label>\n		<label><input name=\"accept_terms\" type=\"checkbox\" /> I agree to the fanclub <a href=\"";
  if (stack1 = helpers.terms_url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.terms_url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" target=\"_blank\">Terms and Conditions</a></label>\n	</fieldset>\n	<button type=\"submit\">Register</button>\n</form>\n";
  return buffer;
  }
function program3(depth0,data) {
  
  
  return "\n		<label>Email<br />\n		<input name=\"email\" type=\"text\" /></label>\n		";
  }

function program5(depth0,data) {
  
  
  return "\n		<label>Username<br />\n		<input name=\"username\" type=\"text\" /></label><br />\n		";
  }

function program7(depth0,data) {
  
  
  return "\n		<label>First Name<br />\n		<input name=\"first_name\" type=\"text\" /></label>\n		";
  }

function program9(depth0,data) {
  
  
  return "\n		<label>Last Name<br />\n		<input name=\"last_name\" type=\"text\" /></label>\n		";
  }

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n		<label>Date of Birth</label>\n		";
  if (stack1 = helpers.birthdate_selector) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.birthdate_selector; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n		";
  return buffer;
  }

  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.customer) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.customer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.customer) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["sparkart"]["Fanclub"]["templates"]["subscription"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"subscription\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>";
  return buffer;
  });

this["sparkart"]["Fanclub"]["templates"]["subscriptions"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n	<li>";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</li>\n	";
  return buffer;
  }

  buffer += "<ul class=\"subscriptions\">\n	";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.subscriptions) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.subscriptions; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.subscriptions) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>";
  return buffer;
  });