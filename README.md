# sparkart.js

Easily interact with Sparkart's APIs via Javascript.

## Usage

In order to use sparkart.js you just need to include the sparkart.js file:

```html
<script src="sparkart.js"></script>
```

Including this file makes the `sparkart` variable available. A multitude of utilities can then be used:

### Fanclubs

Sparkart.js's `Fanclub` utility enables you to access information about a fanclub and include various fanclub widgets in your website. Every fanclub has a unique API key which grants access to that fanclub's data. To work with a specific fanclub, just start a new instance of `sparkart.Fanclub` using the API key for that fanclub.

```javascript
var bonjovi = new sparkart.Fanclub(API_KEY); // This creates an instance of sparkart.Fanclub
```

Now you can utilize your new fanclub object:

```javascript
bonjovi.get( 'plans', function( err, plans ){
	if( err ) console.log( err ); // err is null if nothing goes wrong
	else console.log( plans );
});
bonjovi.draw();
```

#### Fanclub Configuration

Fanclubs can be configured, too! If you need to change something, just pass a configuration object as the second argument when instantiating your fan club.

```javascript
var bonjovi = new sparkart.Fanclub( API_KEY, {
	templates: {
		logout: '<div><a href="#logout">Logout</a></div>'
	}
});
```

The following options are available:

* **templates** - *(object of strings)* - An object containing a list of template names and template contents as strings. See [Custom Templates](https://github.com/SparkartGroupInc/sparkart.js/wiki/Custom-Templates) for more information.
* **preprocessors** - *(object of functions or array)* - An object containing a list of widget names and preprocessor functions. See [Preprocessors](https://github.com/SparkartGroupInc/sparkart.js/wiki/Preprocessors) for more information.
* **reload** - *(boolean or object of booleans)* - Determines whether the page reloads after a method or not. Specify a single boolean to set all reload settings at once, or set each reload individually. Things that reload: `login`, `register`, `logout`. Reload is on by default.

#### Fanclub Properties

After a fanclub is instantiated, some properties are set by default. The following properties are made available:

* **authentications** - Type of third party authentications the site supports, such as Facebook or Twitter.
* **customer** - The current customer's account information. Is `null` if there is no user session (the user isn't logged in).
* **name** - The fanclub's name.
* **key** - The fanclub's API key.
* **preprocessors** - An object of processsing functions used to be run before data is passed to widget templates. This is used internally to normalize dates, add navigation links, and other things. Custom preprocessors should be added using the **preprocessors** option, rather than being set manually.
* **templates** - An object of strings to be used as templates for widgets. Custom templates should be set with the **templates** option, rather than being set manually.

Most of these properties are not set until after the fanclub finishes loading. In order to wait for that, use the "load" event.

#### Fanclub Widgets

In order to make generating fanclub markup easier, sparkart.js has a widget system which automatically renders fanclub html. The following widgets are available by default:

- **account** - The currently logged in user's information.
- **login** - A login form for the fan club.
- **register** - A registration form for the fan club.
- **subscriptions** - The user's current subscriptions.
- **subscription** - A single subscription.
- **plans** - The plans available for this fan club.
- **plan** - A single plan.
- **events** - A list of events.
- **event** - A single event.
- **orders** - A list of orders.
- **order** - A single order.

To use a widget, you need to create a container for that widget with the classes `sparkart` `fanclub` and the widget's name (ex: `account`). Then create the fanclub object or run the `draw()` method if the fanclub object has already been instantiated:

```html
<!-- fanclub object does not exist -->
<div class="sparkart fanclub account"></div>
<script>
	var bonjovi = new sparkart.Fanclub(API_KEY);
</script>

<!-- fanclub object already exists -->
<div class="sparkart fanclub subscriptions"></div>
<script>
	bonjovi.draw();
</script>
```

Custom templates can be defined for fanclub widgets when their markup is not ideal. These templates are all written in [Handlebars](http://handlebarsjs.com/), and they draw their information from the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers). New templates must be passed as strings when initializing the fanclub object:

```javascript
var alternate_template = '<div class="account"><h3>{{username}}</h3><span class="email">{{email}}</span></div>';
var bonjovi = new sparkart.Fanclub( API_KEY, {
	templates: {
		account: alternate_template
	}
});
```

#### Fanclub Methods

##### .logout( callback )

- **callback** - A function to be executed after the logout method completes. Gets `err`.

Logs a user out.

```javascript
bonjovi.logout( function( err ){
	if( err ) return err;
	console.log('User successfully logged out!');
});
```

##### .draw( widget, config )

- **widget** - A jQuery selector (as a string) or a jQuery selection of a specific widget to draw. If nothing is specified, it draws all widgets on the page.
- **config** - An object of options to pass when rendering the widget. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers).

Draws a single widget, collection of widgets, or every widget on the page.

```javascript
bonjovi.draw(); // draws/redraws every widget
bonjovi.draw( '#events', {
	start: 5
}); // draws/redraws the widget at '#events'
```

##### .get( endpoint, parameters, callback )

- **endpoint** - An API endpoint to get information from. ('logout','account','subscriptions','plans','plans/5','events','orders')
- **parameters** - An object of options for the request. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers)
- **callback** - A function to be executed after the request finishes

Gets information from the Fanclubs API.

```javascript
bonjovi.get( 'account', function( err, user ){
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
bonjovi.post( 'login', {
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
bonjovi.destroy(); // all markup reverts to pre-fanclub state
```

##### .on( event, callback )

Binds a callback function to an event.

```javascript
bonjovi.on( 'login', function(){ console.log('logged in!'); });
```

##### .off( event, callback )

Unbinds event callbacks. Can unbind a single function, or every function for an event.

```javascript
bonjovi.off('login'); // unbinds all
bonjovi.off( 'login', myMethod ); // unbinds "myMethod"
```

##### .trigger( event, argument, argument2, argument3... )

Manually trigger an event with the specified arguments.

```javascript
bonjovi.trigger( 'custom', 1, 2, 3 ); // executes the event "custom" with the arguments 1, 2, 3
```


#### Fanclub Events

##### load

Triggered after the fanclub has finished loading its initial set of data. Properties like **customer** are only available at this point.

```javascript
bonjovi.on( 'load', function(){
	console.log( 'The customer\'s name is:', bonjovi.customer.first_name, bonjovi.customer.last_name );
});
```

##### login

Triggered when a customer logs in

##### logout

Triggered when a customer logs out

##### register

Triggered when a customer registers