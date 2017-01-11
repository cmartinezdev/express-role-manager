var express = require('express');
var ExpressRoleManager = require('../index');

var app = express();

// Get roles from user
function getRoles(req){
  return req.params.role;
}

// Get if self
function getSelf(req){
  return req.params.tid === req.params.uid;
}

// Default
function noActionForThatRole(req, res) {
  res.status(403).json({msg: 'No action for that role'})
}

var erm = new ExpressRoleManager({
  defaultCommand: noActionForThatRole
});
erm.addRoleGetter(getRoles);
erm.addRoleGetter('self', getSelf);

app.get('/params/:role/:uid/:tid', function(req, res, next){
  res.json({
    params: req.params,
    roles: erm._obtainRequestRoles(req)
  });
});

app.get('/test1/:role/:uid/:tid', erm.commandPerRole({
  admin: function(req, res){
    res.send("Command admin");
  },  
  user: function(req, res){
    res.send("Command user");
  },
  self: function(req, res){
    res.send("Command self");
  }
}));

app.get('/test2/:role/:uid/:tid', erm.commandPerRole([
  {
    roles: ['user', 'self'],
    command: function(req, res) {
      res.send('User modifying itself.')
    }
  },
  {
    roles: ['admin', 'self'],
    command: function(req, res) {
      res.send('Admin modifying itself.')
    }
  },
  {
    roles: ['admin'],
    command: function(req, res) {
      res.send('Admin modifying other.')
    }
  }
]));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
