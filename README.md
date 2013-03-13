# sparkart.js

Easily interact with Sparkart's APIs via Javascript.

## Usage

In order to use sparkart.js you just need to include the sparkart.js file. Also make sure [Handlebars.js](http://handlebarsjs.com) and [jQuery](http://jquery.com) have been included before sparkart.js.

```html
<!-- Include dependencies -->
<script src="jquery.js"></script>
<script src="handlebars.js"></script>

<!-- Include sparkart.js -->
<script src="sparkart.js"></script>
```

Including this file makes the `sparkart` variable available. A multitude of utilities can then be used:

### Fanclubs

Sparkart.js's `Fanclub` utility enables you to access information about a fanclub and include various fanclub widgets in your website. Every fanclub has a unique API key which grants access to that fanclub's data. This API key can be found under fanclub settings in [Sparkart Tools](http://tools.sparkart.net). To work with a specific fanclub, just start a new instance of `sparkart.Fanclub` using the API key for that fanclub.

```javascript
var fanclub = new sparkart.Fanclub(API_KEY); // This creates an instance of sparkart.Fanclub
```

Now you can utilize your new fanclub object:

```javascript
fanclub.get( 'plans', function( err, plans ){
	if( err ) console.log( err ); // err is null if nothing goes wrong
	else console.log( plans );
});
fanclub.draw();
```

The fanclub object provides a set of properties and functions that allow you to access and update fanclub data. Customers can be logged in, customer data can be used, and most importantly, fanclub widgets can be drawn.

#### Fanclub Configuration

If the default fanclub configuration doesn't suffice, it can always be overriden when you instantiate the fanclub. By passing an object of options after the fanclub's API key, you'll override the default values:

```javascript
var fanclub = new sparkart.Fanclub( API_KEY, {
	templates: {
		logout: '<div><a href="#logout">Logout</a></div>'
	}
});
```

The following options are available:

* **templates** - *(object of strings)* - An object containing a list of template names and template contents as strings. See [Custom Templates](https://github.com/SparkartGroupInc/sparkart.js/wiki/Custom-Templates) for more information.
* **preprocessors** - *(object of functions or array)* - An object containing a list of widget names and preprocessor functions. See [Preprocessors](https://github.com/SparkartGroupInc/sparkart.js/wiki/Preprocessors) for more information.
* **reload** - *(boolean or object of booleans)* - Determines whether the page reloads after a method or not. Specify a single boolean to set all reload settings at once, or set each reload individually. Things that reload: `login`, `register`, `logout`. Reload is on by default.
* **redirect** - *(object of strings)* - Determines where to redirect the customer to after data has been submitted. This can be a relative ('/home') or absolute ('http://google.com') URL.

#### Fanclub Properties

After a fanclub is instantiated, some properties are set by default. The following properties are made available:

* **authentications** - Type of third party authentications the site supports, such as Facebook or Twitter.
* **customer** - The current customer's account information. Is `null` if there is no user session (the user isn't logged in).
* **loaded** - Whether or not the fanclub has finished loading.
* **name** - The fanclub's name.
* **key** - The fanclub's API key.
* **parameters** - The parameters the fanclub is using.
* **preprocessors** - An object of processsing functions used to be run before data is passed to widget templates. This is used internally to normalize dates, add navigation links, and other things. Custom preprocessors should be added using the **preprocessors** option, rather than being set manually.
* **templates** - An object of strings to be used as templates for widgets. Custom templates should be set with the **templates** option, rather than being set manually.

Most of these properties are not set until after the fanclub finishes loading. In order to wait for that, use the "load" event.

#### Fanclub Widgets

In order to make generating fanclub markup easier, sparkart.js has a widget system which automatically renders fanclub html. The following widgets are available by default:

- **[login](https://github.com/SparkartGroupInc/sparkart.js/wiki/Login-widget)** - A login form for the fan club.
- **[logout](https://github.com/SparkartGroupInc/sparkart.js/wiki/Logout-widget)** - A shortcut to log out of the fan club.
- **[register](https://github.com/SparkartGroupInc/sparkart.js/wiki/Register-widget)** - A registration form for the fan club.
- **[password_reset](https://github.com/SparkartGroupInc/sparkart.js/wiki/Password-reset-widget)** - The password reset form.
- **[account](https://github.com/SparkartGroupInc/sparkart.js/wiki/Account-widget)** - A form for editing the current customer's account.
- **[customer](https://github.com/SparkartGroupInc/sparkart.js/wiki/Customer-widget)** - The current customer's information.
- **[plans](https://github.com/SparkartGroupInc/sparkart.js/wiki/Plans-Widget)** - The plans available for this fan club.
- **[plan](https://github.com/SparkartGroupInc/sparkart.js/wiki/Plan-Widget)** - A single plan.
- **[events](https://github.com/SparkartGroupInc/sparkart.js/wiki/Events-widget)** - A list of events.
- **[event](https://github.com/SparkartGroupInc/sparkart.js/wiki/Event-widget)** - A single event.
- **[orders](https://github.com/SparkartGroupInc/sparkart.js/wiki/Orders-widget)** - A list of orders.
- **[order](https://github.com/SparkartGroupInc/sparkart.js/wiki/Order-widget)** - A single order.

To use a widget, you need to create a container for that widget with the classes `sparkart` `fanclub` and the widget's name (ex: `account`). Then create the fanclub object or run the `draw()` method if the fanclub object has already been instantiated:

```html
<!-- fanclub object does not exist -->
<div class="sparkart fanclub account"></div>
<script>
	var fanclub = new sparkart.Fanclub(API_KEY);
</script>

<!-- fanclub object already exists -->
<div class="sparkart fanclub subscriptions"></div>
<script>
	fanclub.draw();
</script>
```

Custom templates can be defined for fanclub widgets when their markup is not ideal. These templates are all written in [Handlebars](http://handlebarsjs.com/), and they draw their information from the [Sparkart Services API](https://github.com/SparkartGroupInc/sparkart-services/tree/master/doc/api). New templates must be passed as strings when initializing the fanclub object:

```javascript
var alternate_template = '<div class="account"><h3>{{username}}</h3><span class="email">{{email}}</span></div>';
var fanclub = new sparkart.Fanclub( API_KEY, {
	templates: {
		account: alternate_template
	}
});
```

#### Fanclub Methods

##### .logout( data, callback )

- **data** - An object of data to pass to the logout API endpoint. This is used internally to pass redirect parameters.
- **callback** - A function to be executed after the logout method completes. Gets `err`.

Logs a user out.

```javascript
fanclub.logout( function( err ){
	if( err ) return err;
	console.log('User successfully logged out!');
});
```

##### .draw( widget, config, callback )

- **widget** - A jQuery selector (as a string) or a jQuery selection of a specific widget to draw. If nothing is specified, it draws all widgets on the page.
- **config** - An object of options to pass when rendering the widget. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers).
- **callback** - A function to execute after the widget renders. It gets 2 arguments: `err, $widget`. `err` is an array of errors if something went wrong, or `null`. `$widget` is the jQuery selection of the widget that was just rendered.

Draws a single widget, collection of widgets, or every widget on the page.

```javascript
fanclub.draw(); // draws/redraws every widget
fanclub.draw( '#events', {
	start: 5
}); // draws/redraws the widget at '#events'
```

##### .get( endpoint, parameters, callback )

- **endpoint** - An API endpoint to get information from. ('logout','account','subscriptions','plans','plans/5','events','orders')
- **parameters** - An object of options for the request. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers)
- **callback** - A function to be executed after the request finishes

Gets information from the Fanclubs API.

```javascript
fanclub.get( 'account', function( err, user ){
	if( err ) return err;
	console.log( 'The user\'s account information', user );
});
```

##### .post( endpoint, parameters, callback )

- **endpoint** - An API endpoint to get information from. ('login','register')
- **parameters** - An object of options for the request. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers)
- **callback** - A function to be executed after the request finishes

Posts information to the Fanclubs API.

```javascript
fanclub.post( 'login', {
	username: 'BJFan68',
	password: '1234'
}, function( err, user ){
	if( err ) return err;
	console.log( 'User has logged in!', user );
});
```

##### .destroy()

Destroy all markup and bindings created by the fanclub.

```javascript
fanclub.destroy(); // all markup reverts to pre-fanclub state
```

##### .on( event, callback )

Binds a callback function to an event.

```javascript
fanclub.on( 'login', function(){ console.log('logged in!'); });
```

##### .off( event, callback )

Unbinds event callbacks. Can unbind a single function, or every function for an event.

```javascript
fanclub.off('login'); // unbinds all
fanclub.off( 'login', myMethod ); // unbinds "myMethod"
```

##### .trigger( event, argument, argument2, argument3... )

Manually trigger an event with the specified arguments.

```javascript
fanclub.trigger( 'custom', 1, 2, 3 ); // executes the event "custom" with the arguments 1, 2, 3
```


#### Fanclub Events

##### load

Triggered after the fanclub has finished loading its initial set of data and rendered the first set of widgets. Properties like **customer** are only available at this point.

```javascript
fanclub.on( 'load', function(){
	console.log( 'The customer\'s name is:', fanclub.customer.first_name, fanclub.customer.last_name );
});
```

##### render

Triggered when a widget renders itself. A jQuery object containing the widget that was just rendered is passed to the event callback.

```javascript
fanclub.on('render', function( $widget ){
	var is_my_widget = ( $my_widget === $widget );
	if( is_my_widget ) console.log('It\'s my widget!');
});
```

##### login

Triggered when a customer logs in

##### logout

Triggered when a customer logs out

##### register

Triggered when a customer registers



## Building the script

Sparkart.js comes with a simple build script which allows us to split out template markup in a reasonable fashion. In order to build Sparkart.js you must have [Node.js](http://nodejs.org/) installed.

```
cd build
node build.js
```
