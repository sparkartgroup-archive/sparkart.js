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
		contest: '<div><h1>Contest!</h1></div>'
	}
});
```

The following options are available:

* **templates** - *(object of strings/functions)* - An object containing a list of template names and template contents as strings or [precompiled Handlebars templates](http://handlebarsjs.com/precompilation.html). See [Custom Templates](https://github.com/SparkartGroupInc/sparkart.js/wiki/Custom-Templates) for more information.
* **preprocessors** - *(object of functions or array)* - An object containing a list of widget names and preprocessor functions. See [Preprocessors](https://github.com/SparkartGroupInc/sparkart.js/wiki/Preprocessors) for more information.
* **redirect** - *(object of strings)* - Determines where to redirect the customer to after data has been submitted. This can be a relative ('/home') or absolute ('http://google.com') URL.
* **environment** - *(string)* - Determines which environment's tracking services to use. If set to `development` will use those instead of production tracking services.

#### Fanclub Properties

After a fanclub is instantiated, some properties are set by default. The following properties are made available:

* **authentications** - Type of third party authentications the site supports, such as Facebook or Twitter.
* **customer** - The current customer's account information. Is `null` if there is no user session (the user isn't logged in).
* **loaded** - Whether or not the fanclub has finished loading.
* **name** - The fanclub's name.
* **key** - The fanclub's API key.
* **parameters** - The parameters the fanclub is using.
* **preprocessors** - An object of processsing functions used to be run before data is passed to widget templates. This is used internally to normalize dates, add navigation links, and other things. Custom preprocessors should be added using the **preprocessors** option, rather than being set manually.
* **templates** - An object of strings or [precompiled Handlebars templates](http://handlebarsjs.com/precompilation.html) to be used as templates for widgets. Custom templates should be set with the **templates** option, rather than being set manually.

Most of these properties are not set until after the fanclub finishes loading. In order to wait for that, use the "load" event.

#### Fanclub Widgets

In order to make generating fanclub markup easier, sparkart.js has a widget system which automatically renders fanclub html. The following widgets are available by default:

- **[password_reset](https://github.com/SparkartGroupInc/sparkart.js/wiki/Password-reset-widget)** - The password reset form.
- **[account](https://github.com/SparkartGroupInc/sparkart.js/wiki/Account-widget)** - A form for editing the current customer's account.
- **[customer](https://github.com/SparkartGroupInc/sparkart.js/wiki/Customer-widget)** - The current customer's information.
- **[affiliates](https://github.com/SparkartGroupInc/sparkart.js/wiki/Affiliates-Widget)** - The current customer's affiliates information.
- **[plans](https://github.com/SparkartGroupInc/sparkart.js/wiki/Plans-Widget)** - The plans available for this fan club.
- **[plan](https://github.com/SparkartGroupInc/sparkart.js/wiki/Plan-Widget)** - A single plan.
- **[events](https://github.com/SparkartGroupInc/sparkart.js/wiki/Events-widget)** - A list of events.
- **[event](https://github.com/SparkartGroupInc/sparkart.js/wiki/Event-widget)** - A single event.
- **[orders](https://github.com/SparkartGroupInc/sparkart.js/wiki/Orders-widget)** - A list of orders.
- **[order](https://github.com/SparkartGroupInc/sparkart.js/wiki/Order-widget)** - A single order.
- **[contests](https://github.com/SparkartGroupInc/sparkart.js/wiki/Contests-widget)** - A list of contests.
- **[contest](https://github.com/SparkartGroupInc/sparkart.js/wiki/Contest-widget)** - A single contest.
- **[subscriptions](https://github.com/SparkartGroupInc/sparkart.js/wiki/Subscriptions-widget)** - The current customer's subscriptions.
- **[subscription](https://github.com/SparkartGroupInc/sparkart.js/wiki/Subscription-widget)** - A single subscription for the current customer.

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

Custom templates can be defined for fanclub widgets when their markup is not ideal. These templates are all written in [Handlebars](http://handlebarsjs.com/), and they draw their information from the [Sparkart Services API](https://github.com/SparkartGroupInc/sparkart-services/tree/master/doc/api). New templates must be passed as strings or [precompiled Handlebars functions](http://handlebarsjs.com/precompilation.html) when initializing the fanclub object:

```javascript
var alternate_template = '<div class="account"><h3>{{username}}</h3><span class="email">{{email}}</span></div>';
var fanclub = new sparkart.Fanclub( API_KEY, {
	templates: {
		account: alternate_template
	}
});
```

**Note**: If a widget relies on the current customer for data, but the user is logged out, it will not make an API request to the Sparkart Services API.  These widgets include `account`, `customer`, `affiliates`, `order`, and `orders`.  These widgets will still be rendered but without receiving any data from the API.  This could be used, for example, in the `customer` widget to prompt the user to login.  Other widgets, such as `events` and `plans` will still request data from the Sparkart Services API, even if the user is logged out.


#### Fanclub Methods

##### .deleteMixpanelCookie()

Deletes the Mixpanel cookie (if it exists)

```javascript
fanclub.deleteMixpanelCookie();
```

##### .setMixpanelDistinctId( callback )

- **callback** - A function to be executed after the setMixpanelDistinctId method completes. Gets `err`.

Grabs the `distinct_id` through the Mixpanel JS API and POSTs it to the server.

\* This requires the user to use `mixpanel` as the variable used to initialize Mixpanel.

This is how it should be initialized:

```javascript
mixpanel.init("YOUR_MIXPANEL_TOKEN", {
	loaded: function(){
	  fanclub.setMixpanelDistinctId();
	}
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

- **endpoint** - An API endpoint to get information from. ('account','subscriptions','plans','plans/5','events','events/5','orders','contests','contests/5')
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

- **endpoint** - An API endpoint to post information to. ('account/register','contests/1/enter')
- **parameters** - An object of options for the request. These options are listed on the endpoints for the [Sparkart Fanclubs API](http://fanclubs.sparkart.com/developers)
- **callback** - A function to be executed after the request finishes

Posts information to the Fanclubs API.

```javascript
fanclub.post( 'account/register', {
	email: 'BJFan68@yahoo.com',
	birthdate: '1968-01-01',
	username: 'BJFan68',
	accept_terms: '1',
	password: 'BJFan68',
	password_confirmation: 'BJFan68'
}, function( err, user ){
	if( err ) return err;
	console.log( 'User has registered!', user );
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
fanclub.on( 'render', function(){ console.log('rendered!'); });
```

##### .off( event, callback )

Unbinds event callbacks. Can unbind a single function, or every function for an event.

```javascript
fanclub.off('render'); // unbinds all
fanclub.off( 'render', myMethod ); // unbinds "myMethod"
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

## Building the script

Sparkart.js uses [Grunt](http://gruntjs.com/) to build the final script. When in development, make sure you edit the files in `/src`, then compile the script. To compile the script, run `grunt build`. To automatically compile the script when anything in `/src` is changed, run `grunt regarde`.
