this.sparkart = {};

// needs to be an API wrapper...

(function( $, Handlebars ){
	
	var API_URL = 'http://editor.storytellerhq.com/sites/303/editor/api/v1/consumer';
	
	var Fanclub = sparkart.Fanclub = function( id, parameters ){
		
		parameters = parameters || {};
		var fanclub = this;
		var templates = {
			subscriptions: '<ul class="subscriptions">{{#subscriptions}}<li>{{name}}</li>{{/subscriptions}}</ul>',
			subscription: '<div class="subscription">{{name}}</div>',
			plans: '<ul class="plans">{{#plans}}<li>{{name}}</li>{{/plans}}</ul>',
			plan: '<div class="plan">{{name}}</div>',
			events: '<ul class="events">{{#events}}<li>{{name}}</li>{{/events}}</ul>',
			event: '<div class="event">{{name}}</div>',
			account: '<div class="account"><h3>{{name}}</h3><a href="mailto:{{email}}">{{email}}</a></div>',
			login: '<form class="login"><input name="username" type="text" /><input name="password" type="password" /><button type="submit">Log In</button></form>',
			register: '<form class="login"><input name="email" type="text" /><input name="username" type="text" /><input name="password" type="password" /><button type="submit">Register</button></form>',
			receipt: '<ul class="receipt">{{#items}}<li>{{name}}</li>{{/items}}</ul>',
			orders: '<ul class="orders">{{#orders}}<li>{{contents}}</li>{{/orders}}</ul>',
			order: '<div class="order">{{contents}}</div>',
			errors: '<ul class="errors">{{#errors}}<li>{{message}}</li>{{/errors}}</ul>'
		};
		if( parameters.templates ) $.extend( templates, parameters.templates );
		for( var name in templates ){
			templates[name] = Handlebars.compile( templates[name] );
		}
		
		// need to know the... fanclub id
		// comb the markup for areas we need to replace	
		// assign new templates if necessary
		
		// draw all widgets
		fanclub.draw();
		fanclub.bindEvents();
		
	};
	
	// register the user
	Fanclub.prototype.register = function( data, callback ){
		
		this.post( 'register', data, function( err, response ){
			
			if( err ){
				if( callback ) callback( err );
				return;
			}
			
			if( callback ) callback( null, response );
			fanclub.draw();
			
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
			fanclub.draw();
			
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
			fanclub.draw();
			
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
		config = config || $widget.data() || {};	
		
		if( $widget.is('.subscriptions') ) widget = 'subscriptions';
		else if( $widget.is('.plans') ) widget = 'plans';
		else if( $widget.is('.events') ) widget = 'events';
		else if( $widget.is('.receipt') ) widget = 'receipt';
		else if( $widget.is('.login') ) widget = 'login';
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
		
		if( widget === 'login' || widget === 'register' ){
			this.get( 'account', function( err, response ){
				if( err ) return callback( err );
				return callback( null, templates[widget]( response ) );
			});
		}
		
		this.get( widget, config, function( err, response ){
			if( err ) return callback( err );
			callback( null, templates[widget]( response ) );
		});
		
	};
	
	// general method for doing AJAX requests
	Fanclub.prototype.request = function( url, method, parameters, callback ){
		
		var request = $.ajax({
			url: url,
			method: method,
			dataType: 'jsonp',
			data: parameters
		});
		
		request
			.done( function( data ){
				if( callback ) callback( null, data );
			})
			.fail( function( request, error_name, err ){
				if( callback ) callback( err );
			});
		
		return request;
		
	};
	
	// shortcut for requesting api data
	Fanclub.prototype.get = function( endpoint, parameters, callback ){
		
		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}
		var url = API_URL +'/'+ endpoint;
		
		return this.request( url, 'GET', parameters, callback );
		
	};
	
	// shortcut for sending api data
	Fanclub.prototype.post = function( endpoint, parameters, callback ){
		
		if( typeof callback === 'undefined' && typeof parameters === 'function' ){
			callback = parameters;
			parameters = null;
		}
		var url = API_URL +'/'+ endpoint;
		
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
				username: $this.find('input[name="username"]').val(),
				password: $this.find('input[name="password"]').val()
			};
			
			fanclub.login( data, function( err, response ){
				
				// remove old error message
				var $previous_errors = $this.data('sparkart_$errors');
				if( $previous_errors ) $previous_errors.remove();
				
				if( err ){
					var $err = $( templates.errors( err ) );
					$this.prepend( $err );
					$this.data( 'sparkart_$errors', $err );
					return;
				}	
				
			});	
			
		});
		
		// bind all register widgets
		$('.sparkart.fanclub.register').on( 'submit.sparkart', function( e ){
			
			e.preventDefault();
			
			var $this = $(this);
			var data = {
				username: $this.find('input[name="username"]').val(),
				email: $this.find('input[name="email"]').val(),
				password: $this.find('input[name="password"]').val(),
				password_confirm: $this.find('input[name="password_confirm"]').val(),
				terms: $this.find('input[name="terms"]').val()
			};
			
			fanclub.register( data, function( err, response ){
				
				// remove old error message
				var $previous_errors = $this.data('sparkart_$errors');
				if( $previous_errors ) $previous_errors.remove();
				
				if( err ){
					var $err = $( templates.errors( err ) );
					$this.prepend( $err );
					$this.data( 'sparkart_$errors', $err );
					return;
				}
				
			});
			
		});
		
	};
	
	Fanclub.prototype.destroy = function(){
		
	};
	
})( jQuery, Handlebars );