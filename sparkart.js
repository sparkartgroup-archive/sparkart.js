this.sparkart = {};

// needs to be an API wrapper...

(function( $, Handlebars ){
	
	var API_URL = 'http://lvh.me:7000/api/v1/consumer';
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
		var day_of_week = new Date( year +'-'+ month +'-'+ day ).getDay();
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
	
	// Fanclub constructor
	var Fanclub = sparkart.Fanclub = function( key, parameters ){
		
		var fanclub = this;
		fanclub.key = key;
		fanclub.parameters = parameters = parameters || {};
		fanclub.parameters.api_url = parameters.api_url || API_URL;
		var templates = fanclub.templates = {
			subscriptions: '<ul class="subscriptions">{{#subscriptions}}<li>{{name}}</li>{{/subscriptions}}</ul>',
			subscription: '<div class="subscription">{{name}}</div>',
			plans: '<ul class="plans">'+
			'	{{#plans}}'+
			'	<li>'+
			'		<h2>{{name}}</h2>'+
			'		<div class="description">{{description}}</div>'+
			'		{{#package}}'+
			'			<h3>{{name}}</h3>'+
			'			<ul class="items">'+
			'				{{#items}}'+
			'				<li>'+
			'					<img src="{{thumbnail}}" />'+
			'					<strong>{{name}}</strong>'+
			'				</li>'+
			'				{{/items}}'+
			'			</ul>'+
			'		{{/package}}'+
			'		{{#annotations}}<sub class="annotations">{{.}}</sub>{{/annotations}}'+
			'	</li>'+
			'	{{/plans}}'+
			'</ul>',
			plan: '<div class="plan">{{name}}</div>',
			events: '<ul class="events">'+
			'	{{#events}}'+
			'	<li>'+
			'		<h2><a href="{{../parameters.url}}{{id}}">{{date.month.abbr}} {{date.day.number}}</a></h2>'+
			'		<h3>{{title}}</h3>'+
			'		<div class="description">{{description}}</div>'+
			'		{{#venue}}'+
			'		<div class="venue">'+
			'			<h4>{{name}}</h4>'+
			'			<strong>{{city}}</strong>, {{state}}'+
			'		</div>'+
			'		{{/venue}}'+
			'		<ul class="links">'+
			'			{{#links}}'+
			'			<li><a href="{{url}}">{{name}}</a></li>'+
			'			{{/links}}'+
			'		</ul>'+
			'	</li>'+
			'	{{/events}}'+
			'</ul>',
			event: '{{#event}}'+
			'<div class="event">'+
			'	<h2>{{date.month.abbr}} {{date.day.number}}</h2>'+
			'	<h3>{{title}}</h3>'+
			'	<div class="description">{{description}}</div>'+
			'	<dl>'+
			'		{{#doors_open}}'+
			'		<dt>Doors Open</dt>'+
			'		<dd>{{hour.half}}:{{minute}} <span class="ampm">{{ampm}}</span></dd>'+
			'		{{/doors_open}}'+
			'		{{#start}}'+
			'		<dt>Start</dt>'+
			'		<dd>{{hour.half}}:{{minute}} <span class="ampm">{{ampm}}</span></dd>'+
			'		{{/start}}'+
			'	</dl>'+
			'	{{#venue}}'+
			'	<div class="venue">'+
			'		<h4>{{name}}</h4>'+
			'		<strong class="city">{{city}}</strong>, <em class="state">{{state}}</em> <span class="country">{{country}}</span>'+
			'		<h5>Directions</h5>'+
			'		<ul class="directions">'+
			'			{{#directions}}'+
			'			<li><a href="{{google_maps}}">Google Maps</a></li>'+
			'			<li><a href="{{yahoo_maps}}">Yahoo Maps</a></li>'+
			'			<li><a href="{{mapquest}}">Mapquest</a></li>'+
			'			<li><a href="{{bing_maps}}">Bing Maps</a></li>'+
			'			{{/directions}}'+
			'		</ul>'+
			'	</div>'+
			'	{{/venue}}'+
			'	<ul class="links">'+
			'		{{#links}}'+
			'		<li><a href="{{url}}">{{name}}</a></li>'+
			'		{{/links}}'+
			'	</ul>'+
			'</div>'+
			'{{/event}}',
			account: '{{#customer}}'+
			'{{#registered}}'+
			'<form class="account">'+
			'	<div class="success" style="display: none;">'+
			'		<p>Account Successfully Updated!</p>'+
			'	</div>'+
			'	<div class="errors" style="display: none;"></div>'+
			'	<fieldset>'+
			'		<legend>Your Account</legend>'+
			'		<label>First Name<br />'+
			'		<input name="first_name" type="text" value="{{first_name}}" /></label><br />'+
			'		<label>Last Name<br />'+
			'		<input name="last_name" type="text" value="{{last_name}}" /></label><br />'+
			'		<label>Email Address<br />'+
			'		<input name="email" type="text" value="{{email}}" /></label><br />'+
			'		<div class="password">'+
			'			<label>Current Password<br />'+
			'			<input name="current_password" type="password" /></label>'+
			'			<hr />'+
			'			<label>New Password<br />'+
			'			<input name="password" type="password" /></label><br />'+
			'			<label>Repeat New Password<br />'+
			'			<input name="password_confirmation" type="password" /></label>'+
			'		</div>'+
			'	</fieldset>'+
			'	<button type="submit">Update Account</button>'+
			'</form>'+
			'{{/registered}}'+
			'{{/customer}}',
			login: '{{^user}}'+
			'<form class="login">'+
			'	<div class="success" style="display: none;">'+
			'		<p>You have successfully logged in.</p>'+
			'	</div>'+
			'	<div class="errors" style="display: none;"></div>'+
			'	<fieldset>'+
			'		<legend>Log In</legend>'+
			'		<label>Email<br />'+
			'		<input name="email" type="text" /></label>'+
			'		<label>Password<br />'+
			'		<input name="password" type="password" /></label>'+
			'		<a href="#forgot">Forgot Password?</a>'+
			'	</fieldset>'+
			'	<button type="submit">Log In</button>'+
			'</form>'+
			'<form class="forgot" style="display:none">'+
			'	<a href="#close">Close</a>'+
			'	<fieldset>'+
			'		<legend>Forgot Password</legend>'+
			'		<p>Please enter the email address you used for your fanclub account:</p>'+
			'		<label>Email<br />'+
			'		<input type="text" name="email"></input>'+
			'	</fieldset>'+
			'	<button type="submit">Submit</button>'+
			'</form>'+
			'{{/user}}',
			logout: '{{#user}}<a href="#logout">Log Out</a>{{/user}}',
			register: '{{#user}}'+
			'{{^registered}}'+
			'<form class="register" method="PUT">'+
			'	<div class="success" style="display: none;">'+
			'		<p>You have successfully completed the registration of your fanclub account.</p>'+
			'	</div>'+
			'	<div class="errors" style="display: none;"></div>'+
			'	<fieldset>'+
			'		<legend>Register your Account</legend>'+
			'		<p>Set a password for your new fanclub account</p>'+
			'		<label>Date of Birth<br />'+
			'		<input name="birthdate" type="text" /></label>'+
			'		<label>Password<br />'+
			'		<input name="password" type="password" /></label>'+
			'		<label>Password Confirm<br />'+
			'		<input name="password_confirmation" type="password" /></label>'+
			'		<label><input name="accept_terms" type="checkbox" /> I agree to the fanclub <a href="{{terms_url}}" target="_blank">Terms and Conditions</a></label>'+
			'	</fieldset>'+
			'	<button type="submit">Register</button>'+
			'</form>'+
			'{{/registered}}'+
			'{{/user}}',
			receipt: '<ul class="receipt">{{#items}}<li>{{name}}</li>{{/items}}</ul>',
			orders: '<ul class="orders">{{#orders}}<li>{{contents}}</li>{{/orders}}</ul>',
			order: '<div class="order">{{contents}}</div>',
			errors: '<ul class="errors">{{#errors}}<li>{{.}}</li>{{/errors}}</ul>'
		};
		var preprocessors = fanclub.preprocessors = {
			event: [ function( data ){
				data.event.date = convertDate( data.event.date );
				data.event.doors_open = convertDate( data.event.doors_open );
				data.event.start = convertDate( data.event.start );
				data.event.venue = convertAddress( data.event.venue );
				return data;
			} ],
			events: [ function( data ){
				for( var i in data.events ){
					var event = data.events[i];
					event.date = convertDate( event.date );
					event.doors_open = convertDate( event.doors_open );
					event.start = convertDate( event.start );
					event.venue = convertAddress( event.venue );
				}
				return data;
			} ]
		};
		if( parameters.templates ) $.extend( templates, parameters.templates );
		if( parameters.preprocessors ){
			for( var key in parameters.preprocessors ){
				var preprocessor = parameters.preprocessors[key];
				if( !preprocessors[key] ) preprocessors[key] = [];
				if( typeof preprocessor === 'function' ) preprocessors[key].push( preprocessor );
				else preprocessors[key].concat( preprocessor );
			}
		}
		for( var name in templates ){
			templates[name] = Handlebars.compile( templates[name] );
		}
		
		// need to know the... fanclub key
		// comb the markup for areas we need to replace	
		// assign new templates if necessary
		
		// draw all widgets
		fanclub.draw();
		fanclub.bindEvents();
		
	};
	
	// register the user
	Fanclub.prototype.register = function( data, callback ){
		
		var fanclub = this;	
		
		this.post( 'account/register', data, function( err, response ){

			if( err ){
				if( callback ) callback( err );
				return;
			}

			if( callback ) callback( null, response );
			
		});
		
	};
	
	// log the user in
	Fanclub.prototype.login = function( data, callback ){
		
		var fanclub = this;	

		this.post( 'login', data, function( err, response ){
			
			if( err ){
				if( callback ) callback( err );
				return;
			}
			
			if( callback ) callback( null, response );
			
		});
		
	};
	
	// log the user out
	Fanclub.prototype.logout = function( callback ){
		
		var fanclub = this;	
		
		this.post( 'logout', null, function( err, response ){
			
			if( err ){
				if( callback ) callback( err );
				return;
			}
			
			if( callback ) callback( null, response );
			
		});
		
	};
	
	// redraw widgets
	// used when authorization status changes
	Fanclub.prototype.draw = function( $widget, config ){
		
		var fanclub = this;	
		
		if( !$widget ){
			var $widgets = $('.sparkart.fanclub');
			$widgets.each( function( i, widget ){
				fanclub.draw( widget )
			});
			return;
		}
		
		var widget;	
		$widget = $($widget); // make sure it's a jquery object
		var data = $widget.data();
		config = config || {};
		config = $.extend( config, data );
		
		if( $widget.is('.subscriptions') ) widget = 'subscriptions';
		else if( $widget.is('.plans') ) widget = 'plans';
		else if( $widget.is('.events') ) widget = 'events';
		else if( $widget.is('.event') ) widget = 'event';
		else if( $widget.is('.receipt') ) widget = 'receipt';
		else if( $widget.is('.login') ) widget = 'login';
		else if( $widget.is('.logout') ) widget = 'logout';
		else if( $widget.is('.register') ) widget = 'register';
		else if( $widget.is('.account') ) widget = 'account';
		else if( $widget.is('.orders') ) widget = 'orders';
		
		$widget
			.removeClass('error')
			.addClass('loading');	

		this.renderWidget( widget, config, function( err, html ){
			if( err ){
				$widget
					.removeClass('loading')
					.addClass('error');
				return;
			}
			$widget
				.html( html )
				.removeClass('loading');
		});
		
	};
	
	// generate a widget's markup
	Fanclub.prototype.renderWidget = function( widget, config, callback ){

		var fanclub = this;	

		if( widget === 'login' || widget === 'logout' || widget === 'register' ){
			this.get( 'account', function( err, response ){
				if( err ) response = {};
				var data = { user: response.customer };
				if( widget === 'register' ) response.terms_url = fanclub.parameters.api_url +'/terms?key='+ fanclub.key;
				data.parameters = config;
				var html = fanclub.templates[widget]( data );
				return callback( null, html );
			});
			return;
		}
	
		this.get( widget, config, function( err, response ){
			if( err ) return callback( err );
			var preprocessors = fanclub.preprocessors[widget];
			if( preprocessors ){
				for( var i in preprocessors ){
					response = preprocessors[i]( response );
				}
			}
			response.parameters = config;console.log(widget, response);
			callback( null, fanclub.templates[widget]( response ) );
		});
		
	};
	
	// general method for doing AJAX requests
	Fanclub.prototype.request = function( url, method, parameters, callback ){

		parameters = $.extend( {}, parameters );
		parameters.key = this.key;
		if( parameters.id ) delete parameters.id;

		var request = $.ajax({
			url: url,
			type: method,
			crossDomain: true,
			xhrFields: {
                withCredentials: true
            },
			dataType: 'json',
			data: parameters
		});
		
		request
			.done( function( data ){
				if( callback ) callback( null, data );
			})
			.fail( function( request ){
				try {
					var responseObj = JSON.parse( request.responseText );
				}
				catch( err ){
					console.error( err );
				}
				var errors = responseObj.messages || [];
				if( callback ) callback( errors );
			});
		
		return request;
		
	};
	
	// shortcut for requesting api data
	Fanclub.prototype.get = function( endpoint, parameters, callback ){	
		
		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}
		
		var fanclub = this;
		parameters = parameters || {};
		if( endpoint === 'event' ) endpoint +='s';	
		
		var url = ( parameters.id )
			? fanclub.parameters.api_url +'/'+ endpoint +'/'+ parameters.id +'.json'
			: fanclub.parameters.api_url +'/'+ endpoint +'.json';
		
		return this.request( url, 'GET', parameters, callback );
		
	};
	
	// shortcut for sending api data
	Fanclub.prototype.post = function( endpoint, parameters, callback ){
		
		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}
		var fanclub = this;
		var url = fanclub.parameters.api_url +'/'+ endpoint +'.json';
		
		return this.request( url, 'POST', parameters, callback );
		
	};
	
	// bind DOM events to widgets
	Fanclub.prototype.bindEvents = function( $widgets ){
		
		var fanclub = this;	
		
		// bind all login widgets
		$('.sparkart.fanclub.login').on( 'submit.sparkart', function( e ){
			
			e.preventDefault();
			
			var $this = $(this);
			var data = {
				email: $this.find('input[name="email"]').val(),
				password: $this.find('input[name="password"]').val()
			};
			
			fanclub.login( data, function( errors, response ){
	
				// remove old error message
				var $errors = $this.find('div.errors');
				$errors.empty().hide();
				
				if( errors ){
					var $err = $( fanclub.templates.errors({ errors: errors }) );
					$errors.html( $err ).show();
					return;
				}
				
				var $success = $this.find('div.success');
				$success.show();
				location.reload();
				
			});	
			
		});
		
		// bind forgot password widget
		$('.sparkart.fanclub.login')
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
				
			});
		
		// bind all logout widgets
		$('.sparkart.fanclub.logout').on( 'click.sparkart', 'a[href="#logout"]', function( e ){
			
			e.preventDefault();
			
			fanclub.logout( function( err ){
				
				if( err ) return console.log( err );
			
				location.reload();
				
			});
			
		});
		
		// bind all register widgets
		$('.sparkart.fanclub.register').on( 'submit.sparkart', function( e ){
			
			e.preventDefault();
			
			var $this = $(this);
			var data = {
				birthdate: $this.find('input[name="birthdate"]').val(),
				password: $this.find('input[name="password"]').val(),
				password_confirmation: $this.find('input[name="password_confirmation"]').val(),
				accept_terms: $this.find('input[name="accept_terms"]').prop('checked')
			};
			
			fanclub.register( data, function( errors, response ){
				
				// remove old error message
				var $errors = $this.find('div.errors');
				$errors.empty().hide();
				
				if( errors ){
					var $err = $( fanclub.templates.errors({ errors: errors }) );
					$errors.html( $err ).show();
					return;
				}
				
				var $success = $this.find('div.success');
				$success.show();	
				location.reload();	
				
			});
			
		});
		
		// bind all account widgets
		$('.sparkart.fanclub.account').on( 'submit.sparkart', function( e ){
			
			e.preventDefault();
			
			var $this = $(this);
			var data = {
				first_name: $this.find('input[name="first_name"]').val(),
				last_name: $this.find('input[name="last_name"]').val(),
				email: $this.find('input[name="email"]').val(),
				current_password: $this.find('input[name="current_password"]').val(),
				password: $this.find('input[name="password"]').val(),
				password_confirmation: $this.find('input[name="password_confirmation"]').val()
			};
			
			fanclub.post( 'account', data, function( errors ){
				
				// remove old error message
				var $errors = $this.find('div.errors');
				$errors.empty().hide();
				
				if( errors ){
					var $err = $( fanclub.templates.errors({ errors: errors }) );
					$errors.html( $err ).show();
					return;
				}
				
				var $success = $this.find('div.success');
				$success.show();
				
			});
			
		});
		
	};
	
	Fanclub.prototype.destroy = function(){
		
	};
	
})( jQuery, Handlebars );