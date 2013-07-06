/* Sparkart.js v000.005.003
   Generated on 2013-07-08 at 20:32:53 */

// Add sparkart to the global namespace
this.sparkart = {};

// Execute code inside a closure
(function( $, Handlebars ){

//
// PRIVATE VARIABLES AND METHODS
////////////////////////////////////////////////////////////////////////////////
//

	// The API url we will look to by default
	var API_URL = 'https://services.sparkart.net/api/v1/consumer';

	// Use correct endpoints in fanclub.get()
	var PLURALIZED_ENDPOINTS = ['contest', 'event', 'order', 'plan'];

	// Widgets that require the user to be logged in to render anything
	var LOGGED_IN_WIDGETS = ['account', 'affiliates', 'customer', 'order', 'orders', 'subscription', 'subscription'];

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
		var day_of_week = new Date( year, month, day ).getDay();
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
			ampm: ( hour / 12 < 1 )? 'AM': 'PM',
			original: date_string,
			timezone_offset: timezone_offset
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
		var default_parameters = {
			redirect: {},
			api_url: API_URL,
			facebook: {},
			environment: 'production'
		};
		fanclub.parameters = $.extend( default_parameters, parameters );

		// Define default preprocessors
		var preprocessors = fanclub.preprocessors = {
			contest: [ function( data ){
				data.contest.minimum_age = ( data.contest.minimum_age > 0 ? data.contest.minimum_age : null );
				data.contest.starts = convertDate( data.contest.starts_at );
				data.contest.ends = convertDate( data.contest.ends_at );
				return data;
			} ],
			contests: [ function( data ){
				$( data.contests ).each( function( i, contest ){
					contest.starts = convertDate( contest.starts_at );
					contest.ends = convertDate( contest.ends_at );
				});
				return data;
			} ],
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
		};
		if( parameters.templates ){
			for( var name in parameters.templates ){
				parameters.templates[name] = parameters.templates[name];
			}
		}
		var templates = fanclub.templates = $.extend( {}, sparkart.Fanclub.templates, parameters.templates );
		for( var i in templates ){
			if( typeof templates[i] === 'string' ) templates[i] = Handlebars.compile( templates[i] );
			else if( typeof templates[i] !== 'function' ) console.error('Template "'+ i +'" is not a string or a template function.')
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
		// NOTE: get this down to a single request instead of 2 or 3
		var requests_complete = 0;
		var account_response, fanclub_response;

		// Check login status, so we can short-circuit other API requests if logged out
		fanclub.get( 'account/status', function( err, response ){
			fanclub.logged_in = response.logged_in;

			if( fanclub.logged_in ){

				fanclub.get( 'account', function( err, response ){
					requests_complete++;
					account_response = response;
					if( requests_complete >= 2 ) drawWidgets();
				});

			} else {

				requests_complete++;
				if( requests_complete >= 2 ) drawWidgets();

			}
		});

		fanclub.get( 'fanclub', function( err, response ){
			requests_complete++;
			fanclub_response = response;
			if( requests_complete >= 2 ) drawWidgets();
		});



		var drawWidgets = function(){
			requests_complete = 0;
			fanclub.customer = ( account_response )? account_response.customer: null;
			fanclub.authentications = ( fanclub_response )? fanclub_response.fanclub.authentications: null;
			fanclub.name = ( fanclub_response )? fanclub_response.fanclub.name: null;

			if(fanclub.parameters.environment === "production") {
				fanclub.tracking = fanclub_response.fanclub.tracking.production;
			}
			else {
				fanclub.tracking = fanclub_response.fanclub.tracking.development;
			}

			if( fanclub.tracking.google_analytics.length > 0 ){
				fanclub.tracking.google_analytics_trackers = [];
				_gaq = (typeof(_gaq) === 'undefined' ? [] : _gaq);

				var pluginUrl = '//www.google-analytics.com/plugins/ga/inpage_linkid.js';

				$.each( fanclub.tracking.google_analytics, function( i, property_id ){
					var tracker = "t" + i;
					fanclub.tracking.google_analytics_trackers.push( tracker );

					_gaq.push([tracker + '._require', 'inpage_linkid', pluginUrl]);
					_gaq.push([tracker + '._setAccount', property_id]);
					_gaq.push([tracker + '._setDomainName', window.location.host]);
					_gaq.push([tracker + '._setAllowLinker', true]);
					_gaq.push([tracker + '._trackPageview']);
				});

				(function() {
					var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
					ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
					var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
				})();
			}

			if( fanclub.tracking.mixpanel ){
				(function(c,a){window.mixpanel=a;var b,d,h,e;b=c.createElement("script");
				b.type="text/javascript";b.async=!0;b.src=("https:"===c.location.protocol?"https:":"http:")+
				'//cdn.mxpnl.com/libs/mixpanel-2.2.min.js';d=c.getElementsByTagName("script")[0];
				d.parentNode.insertBefore(b,d);a._i=[];a.init=function(b,c,f){function d(a,b){
				var c=b.split(".");2==c.length&&(a=a[c[0]],b=c[1]);a[b]=function(){a.push([b].concat(
				Array.prototype.slice.call(arguments,0)))}}var g=a;"undefined"!==typeof f?g=a[f]=[]:
				f="mixpanel";g.people=g.people||[];h=['disable','track','track_pageview','track_links',
				'track_forms','register','register_once','unregister','identify','alias','name_tag','set_config',
				'people.set','people.set_once','people.increment','people.track_charge','people.append'];
				for(e=0;e<h.length;e++)d(g,h[e]);a._i.push([b,c,f])};a.__SV=1.2;})(document,window.mixpanel||[]);

				mixpanel.init(fanclub.tracking.mixpanel, {
					store_google: true,
					save_referrer: true,
					loaded: function(){
						if( fanclub.customer ){
							mixpanel.identify(fanclub.customer.id);
							fanclub.clearMixpanelDistinctId();
						} else {
							fanclub.setMixpanelDistinctId();
						}
					}
				});
			}

			// draw all widgets
			fanclub.draw( function(){
				fanclub.trigger('load');
				fanclub.loaded = true;
			});
		};

	};

//
// PUBLIC METHODS
////////////////////////////////////////////////////////////////////////////////
// Any and all methods available publicly
// Many methods rely on and use each other
//

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

	// clears the mixpanel distinct_id from the session
	Fanclub.prototype.clearMixpanelDistinctId = function( callback ){

		this.post( 'mixpanel/clear_distinct_id', {}, function( err, response ){

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
		else if( $widget.is('.account') ) widget = 'account';
		else if( $widget.is('.customer') ) widget = 'customer';
		else if( $widget.is('.password_reset') ) widget = 'password_reset';
		else if( $widget.is('.order') ) widget = 'order';
		else if( $widget.is('.orders') ) widget = 'orders';
		else if( $widget.is('.affiliates') ) widget = 'affiliates';
		else if( $widget.is('.contest') ) widget = 'contest';
		else if( $widget.is('.contests') ) widget = 'contests';

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

		// Skip API request and render nothing for certain widgets if not logged in
		if( !fanclub.logged_in ){
			if( $.inArray( widget, LOGGED_IN_WIDGETS ) >= 0 ){
				var html = "";

				if( callback ) callback( null, html );
				return;
			}
		}

		// Special cases that use the "account" endpoint
		if( widget === 'customer' || widget === 'account'){
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
		if( $.inArray( endpoint, PLURALIZED_ENDPOINTS ) >= 0 ) endpoint += 's';

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

		// Bind all account widgets
		if( widget === 'account' ){

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

		else if( widget === 'plans' ){

			$widget
			.off( '.sparkart' )
			.on( 'click.sparkart', 'li.join a', function( e ){

				if( typeof(_gaq) !== 'undefined' && fanclub.tracking.google_analytics_trackers.length > 0 ){
					$.each( fanclub.tracking.google_analytics_trackers, function( i, tracker ){
						_gaq.push([tracker + '._link', $(e.target).attr('href')]);
					});
				};

			});

		}

		else if( widget === 'contest' ){

			$widget
			.off( '.sparkart' )
			.on( 'submit.sparkart', function( e ){

				e.preventDefault();

				var $this = $(this);
				var agree = $this.find('input[type="checkbox"]');

				if( agree.length > 0 && !agree.is(':checked') ) {

					// remove old error message
					var $errors = $this.find('div.errors');
					$errors.empty().hide();

					$this.addClass('error');
					var $err = $( fanclub.templates.errors({ errors: ['To Enter, You Must Agree to the Contest Rules'] }) );
					$errors.html( $err ).show();
					return;

				} else {

					$this
						.removeClass('error success')
						.find('div.errors, div.success').hide();

					// deactivate the form
					var $submit = $this.find('button[type="submit"]');
					$submit.prop( 'disabled', true );

					fanclub.post( 'contests/'+ data.id +'/enter', {}, function( errors ){

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

				}

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
"account": "{{#if customer}}<ul class=\"authentications\">	{{#authentications}}	<li><button class=\"{{name}}_connect {{#if connected}}connected{{/if}}\" type=\"button\" {{#if connected}}disabled=\"true\"{{/if}}>{{#if connected}}Connected{{else}}Connect{{/if}} with {{name}}</button></li>	{{/authentications}}</ul>{{/if}}{{#customer}}<form class=\"account\">	<div class=\"success\" style=\"display: none;\">		<p>Account Successfully Updated!</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<label>Username<br />		<input name=\"username\" type=\"text\" value=\"{{username}}\" /></label><br />		<label>First Name<br />		<input name=\"first_name\" type=\"text\" value=\"{{first_name}}\" /></label><br />		<label>Last Name<br />		<input name=\"last_name\" type=\"text\" value=\"{{last_name}}\" /></label><br />		<label>Email Address<br />		<input name=\"email\" type=\"text\" value=\"{{email}}\" /></label><br />		<div class=\"password\">			<label>Current Password<br />			<input name=\"current_password\" type=\"password\" /></label>			<hr />			<label>New Password<br />			<input name=\"password\" type=\"password\" /></label><br />			<label>Repeat New Password<br />			<input name=\"password_confirmation\" type=\"password\" /></label>		</div>	</fieldset>	<button type=\"submit\">Update Account</button></form>{{/customer}}",
"affiliates": "{{#affiliates}}	<h2>{{name}}</h2>	<ul class=\"codes\">		{{#codes}}<li>{{.}}</li>{{/codes}}	</ul>{{/affiliates}}",
"contest": "{{#contest}}<div class=\"{{status}}\">	<h2>{{{name}}}</h2>	{{#if minimum_age}}		<p class=\"minimum-age\">You must be <strong>{{minimum_age}}</strong> or older to enter this contest.</p>	{{/if}}	{{#if details}}	<div class=\"details\">		<h3>Contest Details</h3>		{{{details}}}	</div>	{{/if}}	{{#if rules}}	<div class=\"rules\">		<h3>Contest Rules</h3>		{{{rules}}}	</div>	{{/if}}	<dl>	{{#starts}}		<dt>Starts</dt>		<dd><span class=\"date\">{{month.number}}/{{day.number}}/{{year.full}}</span> <span class=\"time\">at {{hour.half}}:{{minute}}</span> <span class=\"ampm\">{{ampm}}</span></dd>	{{/starts}}	{{#ends}}		<dt>{{#if ../ended}}Ended{{else}}End{{/if}}</dt>		<dd><span class=\"date\">{{month.number}}/{{day.number}}/{{year.full}}</span> <span class=\"time\">at {{hour.half}}:{{minute}}</span> <span class=\"ampm\">{{ampm}}</span></dd>	{{/ends}}	</dl>	{{#if entered}}		<div class=\"success\">			<p>You have already entered into the {{{name}}} contest.</p>		</div>	{{else}}		{{#if running}}		<form class=\"contest\">			<div class=\"success\" style=\"display: none;\">				<ul class=\"success\">					<li>You have been entered into the {{{name}}} contest</li>					<li>If you are chosen as a winner you will be contacted via email for confirmation and further details</li>				</ul>			</div>			<div class=\"errors\" style=\"display: none;\">Error</div>			{{#if rules}}			<fieldset>				<label><input type=\"checkbox\" class=\"agree\" />I agree to the Contest Rules</label><br />			</fieldset>			{{/if}}			<ul class=\"actions\">				<li><button type=\"submit\">Enter Contest</button></li>			</ul>		</form>		{{/if}}	{{/if}}</div>{{/contest}}",
"contests": "<ul>	{{#contests}}	<li class=\"{{status}}\">		<h2><a href=\"{{../parameters.url}}{{id}}\">{{name}}</a></h2>		<dl>		{{#starts}}			<dt>Starts</dt>			<dd><span class=\"date\">{{month.number}}/{{day.number}}/{{year.full}}</span> <span class=\"time\">at {{hour.half}}:{{minute}}</span> <span class=\"ampm\">{{ampm}}</span> <span class=\"timezone\">{{timezone_offset}}</span></dd>		{{/starts}}		{{#ends}}			<dt>{{#if ../ended}}Ended{{else}}End{{/if}}</dt>			<dd><span class=\"date\">{{month.number}}/{{day.number}}/{{year.full}}</span> <span class=\"time\">at {{hour.half}}:{{minute}}</span> <span class=\"ampm\">{{ampm}}</span> <span class=\"timezone\">{{timezone_offset}}</span></dd>	 	{{/ends}}		</dl>		{{#if details}}		<div class=\"details\">			<h3>Contest Details</h3>			{{{details}}}		</div>		{{/if}} 	</li>	{{/contests}}</ul>",
"customer": "{{#customer}}<div class=\"info\">	{{#if username}}	<strong class=\"username\">{{username}}</strong>	{{else}}	<strong class=\"name\">{{first_name}} {{last_name}}</strong>	{{/if}}	{{#subscription}}	<span class=\"subscription\">{{plan.name}}</span>	{{/subscription}}</div>{{/customer}}",
"errors": "<ul class=\"errors\">{{#errors}}<li>{{.}}</li>{{/errors}}</ul>",
"event": "{{#event}}<div class=\"event\">	<h2>{{date.month.abbr}} {{date.day.number}}</h2>	<h3>{{title}}</h3>	<div class=\"description\">{{description}}</div>	<dl>		{{#doors_open}}		<dt>Doors Open</dt>		<dd>{{hour.half}}:{{minute}} <span class=\"ampm\">{{ampm}}</span></dd>		{{/doors_open}}		{{#start}}		<dt>Start</dt>		<dd>{{hour.half}}:{{minute}} <span class=\"ampm\">{{ampm}}</span></dd>		{{/start}}	</dl>	{{#venue}}	<div class=\"venue\">		<h4>{{name}}</h4>		<strong class=\"city\">{{city}}</strong>, <em class=\"state\">{{state}}</em> <span class=\"country\">{{country}}</span>		<h5>Directions</h5>		<ul class=\"directions\">			{{#directions}}			<li><a href=\"{{google_maps}}\">Google Maps</a></li>			<li><a href=\"{{yahoo_maps}}\">Yahoo Maps</a></li>			<li><a href=\"{{mapquest}}\">Mapquest</a></li>			<li><a href=\"{{bing_maps}}\">Bing Maps</a></li>			{{/directions}}		</ul>	</div>	{{/venue}}	<ul class=\"links\">		{{#links}}		<li><a href=\"{{url}}\">{{name}}</a></li>		{{/links}}	</ul></div>{{/event}}",
"events": "<ul class=\"events\">	{{#events}}	<li>		<h2><a href=\"{{../parameters.url}}{{id}}\">{{date.month.abbr}} {{date.day.number}}</a></h2>		<h3>{{title}}</h3>		<div class=\"description\">{{description}}</div>		{{#venue}}		<div class=\"venue\">			<h4>{{name}}</h4>			<strong>{{city}}</strong>, {{state}}		</div>		{{/venue}}		<ul class=\"links\">			{{#links}}			<li><a href=\"{{url}}\">{{name}}</a></li>			{{/links}}		</ul>	</li>	{{/events}}</ul>",
"order": "{{#order}}<div class=\"order\">	<h4>Order {{id}}</h4>	<div class=\"details\">		<h5 class=\"name\">{{plan.name}}</h5>		<span class=\"customer\">Customer ID: <var>{{customer_id}}</var></span>		<ul class=\"dates\">			{{#paid_at}}			<li class=\"paid\">Paid on <var class=\"date\">{{.}}</var></li>			{{/paid_at}}			{{#refunded_at}}			<li class=\"refunded\">Refunded <var class=\"refunded\">{{.}}</var></li>			{{/refunded_at}}		</ul>	</div>	{{#billing_address}}	<div class=\"billing\">		<h6>Billed To</h6>		<p class=\"address\">			{{first_name}} {{last_name}}<br/>			{{address}}<br/>			{{city}}, {{state}}, {{postal_code}}, {{country}}		</p>	</div>	{{/billing_address}}	<ul class=\"shipments\">	{{#shipment}}		<li>			{{#status}}<span class=\"status\">{{.}}</span>{{/status}}			{{#tracking_url}}<var class=\"tracking\"><a href=\"{{.}}\">Track Your Package</a></var>{{/tracking_url}}			<div class=\"shipping\">				<h6>Shipped To</h6>				{{#shipping_address}}				<p class=\"address\">					{{first_name}} {{last_name}}<br/>					{{address}}<br/>					{{city}}, {{state}}, {{postal_code}}, {{country}}				</p>				{{/shipping_address}}			</div>			<ul class=\"items\">			{{#items}}				<li>					{{#thumbnail}}<img class=\"thumbnail\" src=\"{{.}}\" />{{/thumbnail}}					<strong class=\"name\">{{name}}</strong>					{{#option}}<span class=\"option\">{{.}}</span>{{/option}}				</li>			{{/items}}			</ul>		</li>	{{/shipment}}	</ul>	{{#totals}}	<dl class=\"totals\">		<dt class=\"subtotal\">Subtotal</dt>		<dd class=\"subtotal\">${{subtotal}}</dd>		{{#shipping}}		<dt class=\"shipping\">Shipping</dt>		<dd class=\"shipping\">${{.}}</dd>		{{/shipping}}		{{#discount}}		<dt class=\"discount\">Discount</dt>		<dd class=\"discount\">${{.}}</dd>		{{/discount}}		<dt class=\"total\">Total</dt>		<dd class=\"total\">${{total}}</dd>	</dl>	{{/totals}}</div>{{/order}}",
"orders": "<ul class=\"orders\">	{{#orders}}	<li>		<a href=\"{{../parameters.url}}{{id}}\"><h4>Order {{id}}</h4></a>		<div class=\"details\">			<h5 class=\"name\">{{plan.name}}</h5>			<span class=\"customer\">Customer ID: <var>{{customer_id}}</var></span>			<ul class=\"dates\">				{{#paid_at}}				<li class=\"paid\">Paid on <var class=\"date\">{{.}}</var></li>				{{/paid_at}}				{{#refunded_at}}				<li class=\"refunded\">Refunded <var class=\"refunded\">{{.}}</var></li>				{{/refunded_at}}			</ul>		</div>		{{#shipment}}		<ul class=\"shipments\">			<li>				{{#status}}<span class=\"status\">{{.}}</span>{{/status}}				{{#tracking_url}}<var class=\"tracking\"><a href=\"{{.}}\">Track Your Package</a></var>{{/tracking_url}}			</li>		</ul>		{{/shipment}}		{{#totals}}		<dl class=\"totals\">			<dt class=\"subtotal\">Subtotal</dt>			<dd class=\"subtotal\">${{subtotal}}</dd>			{{#shipping}}			<dt class=\"shipping\">Shipping</dt>			<dd class=\"shipping\">${{.}}</dd>			{{/shipping}}			{{#discount}}			<dt class=\"discount\">Discount</dt>			<dd class=\"discount\">${{.}}</dd>			{{/discount}}			<dt class=\"total\">Total</dt>			<dd class=\"total\">${{total}}</dd>		</dl>		{{/totals}}	</li>	{{/orders}}</ul>",
"password_reset": "{{#token}}<form class=\"password_reset\">	<div class=\"success\" style=\"display: none;\">		<p>Password Successfully Updated!</p>	</div>	<div class=\"errors\" style=\"display: none;\"></div>	<fieldset>		<div class=\"password\">			<label>New Password<br />			<input name=\"password\" type=\"password\" /></label><br />			<label>Repeat New Password<br />			<input name=\"password_confirmation\" type=\"password\" /></label>		</div>	</fieldset>	<button type=\"submit\">Update Password</button></form>{{/token}}",
"plan": "<div class=\"plan\">	<h2>{{name}}</h2>	<h3>{{price}}</h3>	<div class=\"description\">{{description}}</div>	{{#package}}		<h3>{{name}}</h3>		<ul class=\"items\">			{{#items}}			<li>				<img src=\"{{thumbnail}}\" />				<strong>{{name}}</strong>			</li>			{{/items}}		</ul>	{{/package}}	<ul class=\"actions\">		<li class=\"join\"><a href=\"{{checkout}}\">Join Now</a></li>	</ul>	{{#annotations}}<sub class=\"annotations\">{{.}}</sub>{{/annotations}}	</div>",
"plans": "<ul class=\"plans\">	{{#plans}}	<li>		<h2>{{name}}</h2>		<h3>{{price}}</h3>		<div class=\"description\">{{description}}</div>		{{#package}}			<h3>{{name}}</h3>			<ul class=\"items\">				{{#items}}				<li>					<img src=\"{{thumbnail}}\" />					<strong>{{name}}</strong>				</li>				{{/items}}			</ul>		{{/package}}		<ul class=\"actions\">			<li class=\"join\"><a href=\"{{checkout}}\">Join Now</a></li>		</ul>		{{#annotations}}<sub class=\"annotations\">{{.}}</sub>{{/annotations}}	</li>	{{/plans}}</ul>",
"receipt": "<ul class=\"receipt\">{{#items}}<li>{{name}}</li>{{/items}}</ul>",
"subscription": "<div class=\"subscription\">{{name}}</div>",
"subscriptions": "<ul class=\"subscriptions\">	{{#subscriptions}}	<li>{{name}}</li>	{{/subscriptions}}</ul>"};