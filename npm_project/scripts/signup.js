const appRoot   = require('app-root-path');
const Email     = require(appRoot+'/core/email');
const Github    = require(appRoot+'/core/github');

var signup = async function() {
    try {
        var account = await Email.createEmail();
        console.error('temp email created');
        await Github.signupAndVerifyGithub(account);
        var result = {email: account.email, username: account.username, password: account.password};
        console.log(result.email);
        console.log(result.username);
        console.log(result.password);
        return result;
    } catch(error) {
        for(var i=0; i<3; i++)
            console.log('NONE');
        console.trace('error happened: '+error);
        process.exit(1);
    }
};

signup();
