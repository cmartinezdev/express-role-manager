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
            
            // Handle the comands based on type
            let commandsToRun;
            if(Array.isArray(commands))
                commandsToRun = handleArrayCommands(roles, commands)
            else if(typeof commands === 'object')
                commandsToRun = handleObjectCommands(roles, commands)
            else
                commandsToRun = [];

            runCommands(commandsToRun, localConf, req, res, next)
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
        let roles = [];

        this._roleGetters.forEach(roleGetter => {
            // Handle key:function role getters
            if(typeof roleGetter === 'object' && roleGetter.function(req))
                return roles.push(roleGetter.role);

            // Handle function role getters
            if(typeof roleGetter === 'function'){
                let rolesRes = roleGetter(req);
                // If returns number or string
                if(typeof rolesRes === 'number' || typeof rolesRes === 'string')
                    return roles.push(rolesRes);
                // If returns array
                roles = roles.concat(rolesRes);
            }
        });

        return roles;
    }

    /**
     * Handles the commands with format:
     * [
     *   {
     *      roles: [],
     *      command: function(req, res, next){}
     *   },
     *   ...
     * ]
     */
    function handleArrayCommands(roles, commands){
        let commandsToRun = [];

        // Find commands
        commands.forEach(commandData => {
            if(!commandData.roles.find(role => roles.indexOf(role) < 0))
                commandsToRun.push(commandData.command);
        });
       
        return commandsToRun;
    }

    /**
     * Handles the commands with format:
     * {
     *   role1: function(req, res, next),
     *   role2: function(req, res, next),
     *   ...
     * }
     */
    function handleObjectCommands(roles, commands){
        let commandsToRun = [];
  
        // Find commands
        for(let role in commands)
            if(roles.indexOf(role) >= 0) commandsToRun.push(commands[role]);
        
        return commandsToRun;
    }

    function runCommands(commandsToRun, localConf, req, res, next){
        // If no commands found with request roles
        if(!commandsToRun.length)
            return localConf.defaultCommand(req, res, next);

        // If callAllCommands is disabled
        if(!localConf.callAllCommands)
            return commandsToRun[0](req, res, next);

        // If callAllCommands is enabled
        commandsToRun.forEach(command => command(req, res, next));
    }
}