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
bonjovi.is( 'logged in', function( err, logged_in ){
	if( err ) console.log( err ); // err is null if nothing goes wrong
	else console.log( logged_in );
});
bonjovi.draw();
```

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