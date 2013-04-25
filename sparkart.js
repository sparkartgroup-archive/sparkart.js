/* Sparkart.js v0.1.0
   Generated on 2013-04-24 at 18:12:40 */

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
			api_url: API_URL,
			facebook: {}
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
				parameters.templates[name] = parameters.templates[name];
			}
		}
		var templates = fanclub.templates = $.extend( {}, sparkart.Fanclub.templates, parameters.templates );
		for( var i in templates ){
			templates[i] = Handlebars.compile( templates[i] );
		}
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
			fanclub.deleteMixpanelCookie();
			delete fanclub.customer;
			var redirect = fanclub.parameters.redirect.logout || data.redirect
			if( redirect ) window.location = redirect;
			else if( fanclub.parameters.reload.logout ) location.reload();
			else fanclub.draw();

		});

	};

	// deletes the Mixpanel cookie -- forcing it to
	// create a new distinct_id for the next user
	Fanclub.prototype.deleteMixpanelCookie = function(){

		var cookies = document.cookie.split(";");
		var mixpanel_key = null;

		for( var index = 0; index < cookies.length; index++ ){
			var key = cookies[index].split("=")[0];

			if( /mp_\w*_mixpanel/.test(key) ) {
				mixpanel_key = key;
				break;
			}
		};

		if( mixpanel_key ) {
			var split_domain = location.host.split('.');
			var domain = "." + split_domain.slice(split_domain.length - 2).join('.');
			document.cookie = mixpanel_key + "=; path=/; domain=" + domain;
		}

	};

	// get mixpanel distinct_id and save it in the session
	// takes the initialized mixpanel object as an argument
	Fanclub.prototype.setMixpanelDistinctId = function( callback ){

		var data = {
			'mixpanel_distinct_id': mixpanel.get_distinct_id()
		};

		this.post( 'mixpanel/set_distinct_id', data, function( err, response ){

			if( err ){
				if( callback ) callback( err );
				return;
			}

			if( callback ) callback( null, response );

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
			if( $widgets.length < 1 ){
				if( callback ){
					// don't trust anyone who does this
					setTimeout( function(){ 
						callback( null, null );
					}, 1);
				}
				return;
			}
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
		if( widget === 'login' || widget === 'logout' || widget === 'register' || widget === 'customer' || widget === 'account'){
			this.get( 'account', function( err, response ){

				if( err ) response = {};

				// add extra information to template json
				response.parameters = config;
				if( fanclub.authentications ){
					response.authentications = [];
					for( var i in fanclub.authentications ) response.authentications.push( $.extend( {}, fanclub.authentications[i] ) );
					if( fanclub.customer ){
						for( var i = response.customer.authentications.length - 1; i >= 0; i-- ){
							customer_authentication = response.customer.authentications[i];
							for( var ii = response.authentications.length - 1; ii >= 0; ii-- ){
								var authentication = response.authentications[ii];
								if( authentication.name === customer_authentication.name ) authentication.connected = true;
							};
						};
					}
				}
				if( widget === 'register' ) response.terms_url = fanclub.parameters.api_url +'/terms?key='+ fanclub.key;

				// run preprocessors
				var preprocessors = fanclub.preprocessors[widget];
				if( preprocessors ){
					$( preprocessors ).each( function( i, preprocessor ){
						response = preprocessor( response );
					});
				}

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

			fanclub.facebookSetup();

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', 'form.login', function( e ){

				e.preventDefault();

				var $this = $(this);
				data = $.extend( data, {
					email: $this.find('input[name="email"]').val(),
					password: $this.find('input[name="password"]').val(),
					facebook_signed_request: $this.find('input[name="facebook_signed_request"]').val()
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

			})
			.on( 'click.sparkart', '.facebook_login', function( e ){

				var $this = $(this);
				var $widget = $this.closest('.sparkart.fanclub');

				fanclub.facebookLogin( function( err, result ){

					if( err ) return err;

					$widget.find('form.login')
						.append('<input name="facebook_signed_request" type="hidden" value="'+ result.authResponse.signedRequest +'" />')
						.trigger('submit');

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

			fanclub.facebookSetup();

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
					accept_terms: $this.find('input[name="accept_terms"]').prop('checked'),
					facebook_signed_request: $this.find('input[name="facebook_signed_request"]').val()
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

			})
			.on( 'click.sparkart', '.facebook_register', function( e ){

				e.preventDefault();

				var $this = $(this);
				var $widget = $this.closest('.sparkart.fanclub');

				fanclub.facebookLogin( function( err, result ){

					if( err ) return console.log( err );

					$widget.find('input[name="email"]').val( result.email );
					$widget.find('input[name="first_name"]').val( result.first_name );
					$widget.find('input[name="last_name"]').val( result.last_name );
					$widget.find('form').append('<input name="facebook_signed_request" type="hidden" value="'+ result.authResponse.signedRequest +'" />');
					$widget.find('input[name="password"], input[name="password_confirmation"]').prop( 'disabled', true );

					if( result.birthday ){

						var birthday_bits = result.birthday.split('/');
						var birth_month = birthday_bits[0];
						var birth_day = birthday_bits[1];
						var birth_year = birthday_bits[2];

						$widget.find(':input[name="birth_month"]').val( parseInt( birth_month, 10 ) );
						$widget.find(':input[name="birth_day"]').val( parseInt( birth_day, 10 ) );
						$widget.find(':input[name="birth_year"]').val( birth_year );

					}

				});

			});

		}

		// Bind all account widgets
		else if( widget === 'account' ){

			fanclub.facebookSetup();

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

			})
			.on( 'click.sparkart', '.facebook_connect', function( e ){

				var $this = $(this);
				var $widget = $this.closest( '.sparkart.fanclub' );

				fanclub.facebookLogin( function( err, response ){
					
					fanclub.post( 'account/connect/facebook', {
						facebook_signed_request: response.authResponse.signedRequest
					}, function( errors, data ){

						// remove old error message
						var $errors = $widget.find('div.errors');
						$errors.empty().hide();

						if( errors ){
							$widget.addClass('error');
							var $err = $( fanclub.templates.errors({ errors: errors }) );
							$errors.html( $err ).show();
							return;
						}

						fanclub.draw( $widget, function( err, $widget ){

							$widget.addClass('success');
							var $success = $widget.find('div.success');
							$success.show();

						});

					});

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

/*
FACEBOOK METHODS
////////////////////////////////////////////////////////////////////////////////
Methods for interacting with facebook
*/

	Fanclub.prototype.facebookSetup = function(){
		
		var fanclub = this;	
		
		// Load the SDK Asynchronously
		(function(d){
			var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
			if (d.getElementById(id)) {return;}
			js = d.createElement('script'); js.id = id; js.async = true;
			js.src = "//connect.facebook.net/en_US/all.js";
			ref.parentNode.insertBefore(js, ref);
		}(document));
		
		window.fbAsyncInit = function(){
			fanclub.facebookInit()
		};
	
	};
	
	Fanclub.prototype.facebookInit = function(){

		var fanclub = this;	
		var facebook_app_id;

		for( var i = this.authentications.length - 1; i >= 0; i-- ){
			if( this.authentications[i].name === 'facebook' ) facebook_app_id = this.authentications[i].app_id;
		}

		FB.init({
			appId: facebook_app_id, // App ID
			channelUrl: this.parameters.facebook.channel_url, // Channel File
			status: true, // check login status
			cookie: true, // enable cookies to allow the server to access the session
			xfbml: true  // parse XFBML
		});
	
	};
	
	Fanclub.prototype.facebookProfile = function( callback ){
			
		FB.api( '/me', function( response ){
			if( callback ) callback( response );
		});	
		
	};

	Fanclub.prototype.facebookLogin = function( callback ){

		var fanclub = this;

		FB.login( function( response ){
			// User accepts dialog (into their heart)
			if( response.authResponse ){
				fanclub.facebookProfile( function( profile ){
					profile.authResponse = response.authResponse;
					if( callback ) callback( null, profile );
				});
			// User cancels dialog
			} else {
				if( callback ) callback( 'Login cancelled' );
			}
		}, {
			scope: 'email,user_birthday'	
		});

	};

// Pass jQuery and Handlebars to the closure
})( jQuery, Handlebars );
;this.sparkart.Fanclub.templates = {
"account": "{{#if customer}}{{#if customer.registered}}<ul class=\"authentications\">	{{#authentications}}	<li><button class=\"{{name}}_connect {{#if connected}}connected{{/if}}\" type=\"button\" {{#if connected}}disabled=\"true\"{{/if}}>{{#if connected}}Connected{{else}}Connect{{/if}} with {{name}}</button></li>	{{/authentications}}</ul>{{/if}}{{/if}}{{#customer}}{{#registered}}<form class=\"account\">	<div class=\"success\" style=\"display: none;\">		<p>Account Successfully Updated!</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<label>Username<br />		<input name=\"username\" type=\"text\" value=\"{{username}}\" /></label><br />		<label>First Name<br />		<input name=\"first_name\" type=\"text\" value=\"{{first_name}}\" /></label><br />		<label>Last Name<br />		<input name=\"last_name\" type=\"text\" value=\"{{last_name}}\" /></label><br />		<label>Email Address<br />		<input name=\"email\" type=\"text\" value=\"{{email}}\" /></label><br />		<div class=\"password\">			<label>Current Password<br />			<input name=\"current_password\" type=\"password\" /></label>			<hr />			<label>New Password<br />			<input name=\"password\" type=\"password\" /></label><br />			<label>Repeat New Password<br />			<input name=\"password_confirmation\" type=\"password\" /></label>		</div>	</fieldset>	<button type=\"submit\">Update Account</button></form>{{/registered}}{{/customer}}",
"affiliates": "{{#affiliates}}	<h2>{{name}}</h2>	<ul class=\"codes\">		{{#codes}}<li>{{.}}</li>{{/codes}}	</ul>{{/affiliates}}",
"customer": "{{#customer}}{{#registered}}<div class=\"info\">	{{#if username}}	<strong class=\"username\">{{username}}</strong>	{{else}}	<strong class=\"name\">{{first_name}} {{last_name}}</strong>	{{/if}}	{{#subscription}}	<span class=\"subscription\">{{plan.name}}</span>	{{/subscription}}</div>{{/registered}}{{/customer}}",
"errors": "<ul class=\"errors\">{{#errors}}<li>{{.}}</li>{{/errors}}</ul>",
"event": "{{#event}}<div class=\"event\">	<h2>{{date.month.abbr}} {{date.day.number}}</h2>	<h3>{{title}}</h3>	<div class=\"description\">{{description}}</div>	<dl>		{{#doors_open}}		<dt>Doors Open</dt>		<dd>{{hour.half}}:{{minute}} <span class=\"ampm\">{{ampm}}</span></dd>		{{/doors_open}}		{{#start}}		<dt>Start</dt>		<dd>{{hour.half}}:{{minute}} <span class=\"ampm\">{{ampm}}</span></dd>		{{/start}}	</dl>	{{#venue}}	<div class=\"venue\">		<h4>{{name}}</h4>		<strong class=\"city\">{{city}}</strong>, <em class=\"state\">{{state}}</em> <span class=\"country\">{{country}}</span>		<h5>Directions</h5>		<ul class=\"directions\">			{{#directions}}			<li><a href=\"{{google_maps}}\">Google Maps</a></li>			<li><a href=\"{{yahoo_maps}}\">Yahoo Maps</a></li>			<li><a href=\"{{mapquest}}\">Mapquest</a></li>			<li><a href=\"{{bing_maps}}\">Bing Maps</a></li>			{{/directions}}		</ul>	</div>	{{/venue}}	<ul class=\"links\">		{{#links}}		<li><a href=\"{{url}}\">{{name}}</a></li>		{{/links}}	</ul></div>{{/event}}",
"events": "<ul class=\"events\">	{{#events}}	<li>		<h2><a href=\"{{../parameters.url}}{{id}}\">{{date.month.abbr}} {{date.day.number}}</a></h2>		<h3>{{title}}</h3>		<div class=\"description\">{{description}}</div>		{{#venue}}		<div class=\"venue\">			<h4>{{name}}</h4>			<strong>{{city}}</strong>, {{state}}		</div>		{{/venue}}		<ul class=\"links\">			{{#links}}			<li><a href=\"{{url}}\">{{name}}</a></li>			{{/links}}		</ul>	</li>	{{/events}}</ul>",
"login": "{{^customer}}<ul class=\"authentications\">	{{#authentications}}	<li><button class=\"{{name}}_login\" type=\"button\">Login with {{name}}</button></li>	{{/authentications}}</ul><form class=\"login\">	<div class=\"success\" style=\"display: none;\">		<p>You have successfully logged in.</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<label>Email<br />		<input name=\"email\" type=\"text\" /></label>		<label>Password<br />		<input name=\"password\" type=\"password\" /></label>		<a href=\"#forgot\">Forgot Password?</a>	</fieldset>	<button type=\"submit\">Log In</button></form><form class=\"forgot\" style=\"display:none\">	<a href=\"#close\">Close</a>	<div class=\"success\" style=\"display: none;\">		<p>A message has been sent to this address. Please check your email for instructions on how to reset your password.</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<p>Please enter the email address you used for your fanclub account:</p>		<label>Email<br />		<input type=\"text\" name=\"email\"></input>	</fieldset>	<button type=\"submit\">Submit</button></form>{{/customer}}",
"logout": "{{#customer}}<a href=\"#logout\">Log Out</a>{{/customer}}",
"order": "{{#order}}<div class=\"order\">	<h4>Order {{id}}</h4>	<div class=\"details\">		<h5 class=\"name\">{{plan.name}}</h5>		<span class=\"customer\">Customer ID: <var>{{customer_id}}</var></span>		<ul class=\"dates\">			{{#paid_at}}			<li class=\"paid\">Paid <var class=\"date\">{{.}}</var></li>			{{/paid_at}}			{{#refunded_at}}			<li class=\"refunded\">Refunded <var class=\"refunded\">{{.}}</var></li>			{{/refunded_at}}		</ul>	</div>	{{#billing_address}}	<div class=\"billing\">		<h6>Billed To</h6>		<ul class=\"address\">			<li class=\"name\">{{first_name}} {{last_name}}</li>			<li class=\"country\">{{country}}</li>			<li class=\"address line1\">{{address}}</li>			<li class=\"address line2\">{{city}}, {{state}}, {{postal_code}}</li>		</ul>	</div>	{{/billing_address}}	<ul class=\"shipments\">	{{#shipments}}		<li>			{{#tracking_number}}<var class=\"tracking\">{{.}}</var>{{/tracking_number}}			<div class=\"shipping\">				<h6>Shipped To</h6>				{{#shipping_address}}				<ul class=\"address\">					<li class=\"name\">{{first_name}} {{last_name}}</li>					<li class=\"address line1\">{{address}}</li>					<li class=\"address line2\">{{city}}, {{state}}, {{postal_code}}, {{country}}</li>				</ul>				{{/shipping_address}}			</div>			{{#ship_date}}<span class=\"shipped\">Shipped On <var class=\"date\">{{.}}</var></span>{{/ship_date}}			<ul class=\"items\">			{{#items}}				<li>					{{#thumbnail}}<img class=\"thumbnail\" src=\"{{.}}\" />{{/thumbnail}}					<strong class=\"name\">{{name}}</strong>					{{#option}}<span class=\"option\">{{.}}</span>{{/option}}				</li>			{{/items}}			</ul>		</li>	{{/shipments}}	</ul>	{{#totals}}	<dl class=\"totals\">		<dt class=\"subtotal\">Subtotal</dt>		<dd class=\"subtotal\">${{subtotal}}</dd>		{{#shipping}}		<dt class=\"shipping\">Shipping</dt>		<dd class=\"shipping\">${{.}}</dd>		{{/shipping}}		{{#discount}}		<dt class=\"discount\">Discount</dt>		<dd class=\"discount\">${{.}}</dd>		{{/discount}}		<dt class=\"total\">Total</dt>		<dd class=\"total\">${{total}}</dd>	</dl>	{{/totals}}</div>{{/order}}",
"orders": "<ul class=\"orders\">	{{#orders}}	<li>		<a href=\"{{../parameters.url}}{{id}}\"><h4>Order {{id}}</h4></a>		<div class=\"details\">			<h5 class=\"name\">{{plan.name}}</h5>			<span class=\"customer\">Customer ID: <var>{{customer_id}}</var></span>			<ul class=\"dates\">				{{#paid_at}}				<li class=\"paid\">Paid <var class=\"date\">{{.}}</var></li>				{{/paid_at}}				{{#refunded_at}}				<li class=\"refunded\">Refunded <var class=\"refunded\">{{.}}</var></li>				{{/refunded_at}}			</ul>		</div>		{{#totals}}		<dl class=\"totals\">			<dt class=\"subtotal\">Subtotal</dt>			<dd class=\"subtotal\">${{subtotal}}</dd>			{{#shipping}}			<dt class=\"shipping\">Shipping</dt>			<dd class=\"shipping\">${{.}}</dd>			{{/shipping}}			{{#discount}}			<dt class=\"discount\">Discount</dt>			<dd class=\"discount\">${{.}}</dd>			{{/discount}}			<dt class=\"total\">Total</dt>			<dd class=\"total\">${{total}}</dd>		</dl>		{{/totals}}	</li>	{{/orders}}</ul>",
"password_reset": "{{#token}}<form class=\"password_reset\">	<div class=\"success\" style=\"display: none;\">		<p>Password Successfully Updated!</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<div class=\"password\">			<label>New Password<br />			<input name=\"password\" type=\"password\" /></label><br />			<label>Repeat New Password<br />			<input name=\"password_confirmation\" type=\"password\" /></label>		</div>	</fieldset>	<button type=\"submit\">Update Password</button></form>{{/token}}",
"plan": "<div class=\"plan\">	<h2>{{name}}</h2>	<h3>{{price}}</h3>	<div class=\"description\">{{description}}</div>	{{#package}}		<h3>{{name}}</h3>		<ul class=\"items\">			{{#items}}			<li>				<img src=\"{{thumbnail}}\" />				<strong>{{name}}</strong>			</li>			{{/items}}		</ul>	{{/package}}	<ul class=\"actions\">		<li class=\"join\"><a href=\"{{checkout}}\">Join Now</a></li>	</ul>	{{#annotations}}<sub class=\"annotations\">{{.}}</sub>{{/annotations}}	</div>",
"plans": "<ul class=\"plans\">	{{#plans}}	<li>		<h2>{{name}}</h2>		<h3>{{price}}</h3>		<div class=\"description\">{{description}}</div>		{{#package}}			<h3>{{name}}</h3>			<ul class=\"items\">				{{#items}}				<li>					<img src=\"{{thumbnail}}\" />					<strong>{{name}}</strong>				</li>				{{/items}}			</ul>		{{/package}}		<ul class=\"actions\">			<li class=\"join\"><a href=\"{{checkout}}\">Join Now</a></li>		</ul>		{{#annotations}}<sub class=\"annotations\">{{.}}</sub>{{/annotations}}	</li>	{{/plans}}</ul>",
"receipt": "<ul class=\"receipt\">{{#items}}<li>{{name}}</li>{{/items}}</ul>",
"register": "{{#if customer}}{{#unless customer.registered}}<ul class=\"authentications\">	{{#authentications}}	<li><button class=\"{{name}}_register\" type=\"button\">Register with {{name}}</button></li>	{{/authentications}}</ul>{{/unless}}{{/if}}{{#customer}}{{^registered}}<form class=\"register\" method=\"PUT\">	<div class=\"success\" style=\"display: none;\">		<p>You have successfully completed the registration of your fanclub account.</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<p>Complete your fanclub account registration.</p>		{{^email}}		<label>Email<br />		<input name=\"email\" type=\"text\" /></label>		{{/email}}		{{#username_required}}		<label>Username<br />		<input name=\"username\" type=\"text\" /></label><br />		{{/username_required}}		{{^first_name}}		<label>First Name<br />		<input name=\"first_name\" type=\"text\" /></label>		{{/first_name}}		{{^last_name}}		<label>Last Name<br />		<input name=\"last_name\" type=\"text\" /></label>		{{/last_name}}		{{^birthdate}}		<label>Date of Birth</label>		{{{birthdate_selector}}		{{/birthdate}}		<label>Password<br />		<input name=\"password\" type=\"password\" /></label>		<label>Password Confirm<br />		<input name=\"password_confirmation\" type=\"password\" /></label>		<label><input name=\"accept_terms\" type=\"checkbox\" /> I agree to the fanclub <a href=\"{{terms_url}}\" target=\"_blank\">Terms and Conditions</a></label>	</fieldset>	<button type=\"submit\">Register</button></form>{{/registered}}{{/customer}}",
"subscription": "<div class=\"subscription\">{{name}}</div>",
"subscriptions": "<ul class=\"subscriptions\">	{{#subscriptions}}	<li>{{name}}</li>	{{/subscriptions}}</ul>"};