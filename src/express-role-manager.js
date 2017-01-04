module.exports = ExpressRoleManager;

function ExpressRoleManager(options){
    if(!this instanceof ExpressRoleManager) {
        return new ExpressRoleManager(options);
    }

    options = options || {};

    var roleGetters = new Array();
    var callAllCommands = Boolean(options.callAllCommands);
    var defaultCommand = options.defaultCommand || function(req, res, next){
        next();
    };

    /**
     * 
     */
    this.addRoleGetter = function(){
        if(arguments.length === 1) {
            if(typeof arguments[0] !== 'function')
                throw new Error("Role getter must be a function.");
            return roleGetters.push(arguments[0]);
        }
        if(typeof arguments[0] !== 'string' && typeof arguments[0] !== 'number')
            throw new Error("Role getter identifier must be a string or a number.");
        if(typeof arguments[1] !== 'function')
            throw new Error("Role getter must be a function.");
        roleGetters.push({
            role: arguments[0],
            function: arguments[1]
        });
    };

    /**
     * 
     */
    this.commandPerRole = function(commands){
        return function(req, res, next) {
            loadRequestRoles(req);
            
            // TODO run command
            console.log("Roles: ", req._expressRoleManager.roles);

            defaultCommand(req, res, next);
        }
    }

    /**
     * 
     */
    function loadRequestRoles(req) {
        req._expressRoleManager = {};
        req._expressRoleManager.roles = obtainRequestRoles(req);
    }

    /**
     * 
     */
    function obtainRequestRoles(req) {
        var roles = [];

        roleGetters.forEach(roleGetter => {
            if(typeof roleGetter === 'object' && roleGetter.function(req))
                return roles.push(roleGetter.role);

            if(typeof roleGetter !== 'function') return;
            var rolesRes = roleGetter(req);
            if(typeof rolesRes === 'number' || typeof rolesRes === 'string')
                return roles.push(rolesRes);
            roles = roles.concat(rolesRes);
        });

        return roles;
    }
}