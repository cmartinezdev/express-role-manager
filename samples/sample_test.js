var express = require('express');
var ExpressRoleManager = require('../index');

var app = express();

var erm = new ExpressRoleManager();
erm.addRoleGetter(function(){return 'role1'});
erm.addRoleGetter(function(){return ['role3', 'role4']});
erm.addRoleGetter('role6', function(){return true});
erm.addRoleGetter('role7', function(){return false});

app.get('/', erm.commandPerRole({
  role6: function(req, res, next){console.log("Me llamaron"); next()}
}), function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
