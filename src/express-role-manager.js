module.exports = ExpressRoleManager;

function ExpressRoleManager(conf){
    // Ensure instance
    if(!this instanceof ExpressRoleManager)
        return new ExpressRoleManager(conf);

    // Init conf
    this._conf = Object.assign({
        callAllCommands: false,
        defaultCommand: (req, res, next) => next()
    }, conf);

    // Init _roleGetters object
    this._roleGetters = new Array();

    /**
     * Adds a role getter to the _roleGetters list.
     */
    this.addRoleGetter = function(){
        // Handle function role getters
        if(arguments.length === 1) {
            if(typeof arguments[0] !== 'function')
                throw new Error("Role getter must be a function.");
            return this._roleGetters.push(arguments[0]);
        }

        // Handle key:functiion role getters
        if(typeof arguments[0] !== 'string' && typeof arguments[0] !== 'number')
            throw new Error("Role getter identifier must be a string or a number.");
        if(typeof arguments[1] !== 'function')
            throw new Error("Role getter must be a function.");
        this._roleGetters.push({
            role: arguments[0],
            function: arguments[1]
        });
    };

    /**
     * Returns a middleware that runs functions based on roles
     * Command format:
     * [
     *   {
     *      roles: [],
     *      command: function(req, res, next){}
     *   },
     *   ...
     * ]
     * or
     * {
     *   role1: function(req, res, next),
     *   role2: function(req, res, next),
     *   ...
     * }
     */
    this.commandPerRole = function(commands, conf){
        // Get exec config
        var localConf = Object.assign({}, this._conf, conf);

        // Generate express middleware
        return (req, res, next) => {
            // Load requester roles in request object
            let roles = this._loadRequestRoles(req);
            
            console.log("Roles: ", req._expressRoleManager.roles);
            console.log("Commands: ", commands);

            if(Array.isArray(commands))
                handleArrayCommands(roles, commands, localConf, req, res, next)
            else if(typeof commands === 'object')
                handleObjectCommands(roles, commands, localConf, req, res, next)
            else
                localConf.defaultCommand(req, res, next);
        }
    }

    /**
     * Loads requester roles in request object
     */
    this._loadRequestRoles = function(req) {
        req._expressRoleManager = {};
        req._expressRoleManager.roles = this._obtainRequestRoles(req);
        return req._expressRoleManager.roles;
    }

    /**
     * Obtains roles from request
     */
    this._obtainRequestRoles = function(req) {
        var roles = [];

        this._roleGetters.forEach(roleGetter => {
            // Handle key:function role getters
            if(typeof roleGetter === 'object' && roleGetter.function(req))
                return roles.push(roleGetter.role);

            // Handle function role getters
            if(typeof roleGetter !== 'function')
                return;
            var rolesRes = roleGetter(req);
            if(typeof rolesRes === 'number' || typeof rolesRes === 'string')
                return roles.push(rolesRes);
            roles = roles.concat(rolesRes);
        });

        return roles;
    }

    function handleArrayCommands(roles, commands, localConf, req, res, next){
        let commandsToRun = [];

        commands.forEach(commandData => {
            // TODO
        });
       
        runCommands(commandsToRun, localConf, req, res, next);
    }

    function handleObjectCommands(roles, commands, localConf, req, res, next){
        let commandsToRun = [];
  
        for(let role in commands)
            if(roles.indexOf(role) >= 0) commandsToRun.push(commands[role]);
        
        runCommands(commandsToRun, localConf, req, res, next);
    }

    function runCommands(commandsToRun, localConf, req, res, next){
        if(!commandsToRun.length)
            return localConf.defaultCommand(req, res, next);

        if(!localConf.callAllCommands)
            return commandsToRun[0](req, res, next);

        commandsToRun.forEach(command => command(req, res, next));
    }
}