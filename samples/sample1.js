var express = require('express');
var ExpressRoleManager = require('../index');

var app = express();

var erm = new ExpressRoleManager();
erm.addRoleGetter(function(){return 'role1'});
erm.addRoleGetter(function(){return ['role3', 'role4']});
erm.addRoleGetter('role6', function(){return true});
erm.addRoleGetter('role7', function(){return false});
console.log(erm);


app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
