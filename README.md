# express-role-manager

#### Express middleware for simple authorization with multiple roles.

Easy and simple middleware for Express. Allows handling multiple commands
based on the requester roles.

### 1. Installation

```bash
npm install --save express-role-manager
```

### 2. Usage

The module needs two steps to work. A configuration step, and the usage as
middleware step.

#### 2.1 Configuration

In this step, we can configure how the role manager get the roles from the
request. We can also configure the command if there isn't a role match, and
what the role manager have to do whit the role matches.

##### 2.1.2 Initialization

In this step we create an instance of the express-role-manager.

```javascript
// Import express-role-manager
var ExpressRoleManager = require('express-role-manager');

// Create instance
var erm = new ExpressRoleManager();
```

The constructor have one parameter, in which we can configure some default
parameters. We can configure what to do when there isn't any role match ("defaultCommand") and if
the middleware run all the commands that matches the roles or only the first one ("callAllCommands").

```javascript
// Import express-role-manager
var ExpressRoleManager = require('express-role-manager');

// Options
var options = {
    defaultCommand: function(req, res, next) {
        res.sendStatus(403);
    },
    callAllCommands: false
}

// Create instance
var erm = new ExpressRoleManager(options);
```

##### 2.2.3 Role getters

The second steps consist in configure how to get the roles from the request.
To add a role getter we use the "addRoleGetter" function. We can use that
function in two ways.

The first one consist on using a funcion as a
parameter. That function must return a number or a string, or an Array of 
numbers or strings.

```javascript
// Gets roles from token stored in request object
erm.addRoleGetter(function(req){
    return req.token.role;
});
```

The other way consist on using a key as first argument, and a funcion as a
second arguments. If the function result evaluates to true, the key string
will be added to the requester roles.

```javascript
// Adds self role if the token id is equal to the tid parameter of the request.
erm.addRoleGetter("self", function(req){
    return req.token.id == req.params.tid;
});
```

You can add as many role getters as you want. All of them will be evaluated to
get the list of roles of the request.

#### 2.2 Middleware

After configure how to get the roles from the request we can use it as
middleware. We have two different ways to do this using the "commandPerRole"
function.

The first one is using an object as argument of the function. The keys of the
object will be the roles, and the values the commands to run.

```javascript
app.get('/test_1', erm.commandPerRole({
  admin: function(req, res, next){
    res.send("Command admin"); // If admin role in request
  },  
  user: function(req, res, next){
    res.send("Command user"); // If user role in request
  },
  self: function(req, res, next){
    res.send("Command self"); // If self role in request
  }
}));
```

The second way is using an array of objects as argument. Each one must have
two propierties, an array of roles ("roles"), and the command to run if there
is a role match ("command").

```javascript
app.get('/test_2', erm.commandPerRole([
  {
    roles: ['user', 'self'],
    command: function(req, res, next) { // If user and self roles in request
      res.send('User modifying itself.')
    }
  },
  {
    roles: ['admin', 'self'],
    command: function(req, res, next) { // If admin and self roles in request
      res.send('Admin modifying itself.')
    }
  },
  {
    roles: ['admin'],
    command: function(req, res, next) { // If admin role in request
      res.send('Admin modifying other.')
    }
  }
]));
```

As can be seen in the example, each command is called with the req, res, next
parameters of the request.

### 3. API
