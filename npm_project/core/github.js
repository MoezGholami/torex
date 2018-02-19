const appRoot       = require('app-root-path');
const Email         = require(appRoot+'/core/email');
const PhantomUtils  = require(appRoot+'/core/phantomUtils');

var signupGithub = async function(account, page, loadWaitFunction) {
    var waitForLoad = loadWaitFunction;

    await page.open('https://github.com/join?source=header-home');
    await waitForLoad();
    await page.evaluate(function(account) {
        var usernameElement = document.getElementById('user_login');
        var emailElement = document.getElementById('user_email');
        var passwordElement = document.getElementById('user_password');
        var form = document.getElementById('signup-form');

        usernameElement.value = account.username;
        emailElement.value = account.email;
        passwordElement.value = account.password;
        form.submit();
    }, account);
    await waitForLoad();
    await page.evaluate(function() {
        var forms = document.getElementsByTagName("form");
        var form = null;
        for(var i=0; i<forms.length; ++i) {
            if(forms[i].action.indexOf('join') !== -1) {
                form = forms[i];
                break ;
            }
        }
        if(form)
            form.submit();
    });
    await waitForLoad();
    await page.evaluate(function() { location.replace('https://github.com/dashboard'); });
    await waitForLoad();
};

var verifyGithubAccount = async function(account, page, loadWaitFunction){
    var waitForLoad = loadWaitFunction;
    var confirmLink = await Email.fetchEmails(account).
        then((emails) => {
            console.error('emails fetched: length: ');
            console.error(emails.length);
            return extractGithubVerificationLink(emails);
        });
    await page.open(confirmLink);
    await waitForLoad();
}

var extractGithubVerificationLink = function(emails) {
    return new Promise((resolve, reject) => {
        var found = false;
        for(var i=0; i<emails.length && !found; i++)
            if(emails[i].text) {
                var links = emails[i].text.match(/href="([^\'\"]+)/gm);
                for(var j=0; j<links.length && !found; j++)
                    if (/confirm/.test(links[j]) ) {
                        found = true;
                        resolve(links[j].substring(6));
                    }
            }
        reject(new Error('no verification link'));
    });
};

var signupForTravisCI = async function(account, page, loadWaitFunction){
    var waitForLoad = loadWaitFunction;
    await page.evaluate(function() { location.replace('https://travis-ci.org'); });
    await waitForLoad();
    await page.render('first_page.pdf');
    await page.evaluate(function() {
        location.replace("https://api.travis-ci.org/auth/handshake?redirect_uri=https://travis-ci.org/");

    });
    // /*
    for(var i=0; i<2; i++) {
        await waitForLoad();
        await page.render('auth.pdf');
        await page.evaluate(function() {
            console.log(document.URL);
            var button = document.getElementById('js-oauth-authorize-btn');
            button.disabled=false;
            button.click();
        });
        await waitForLoad();
        await page.render('after-auth-form.pdf');
        await page.evaluate(function() {console.log(document.URL);});
    }
    // */
}

var signupAndVerifyGithub = async function(account) {
    var o = await PhantomUtils.setupPhantom();
    var phantomInstance = o.phantomInstance;
    var page = o.page;
    var waitForLoad = o.waitForLoad;

    await signupGithub(account, page, waitForLoad);
    console.error('signed up in github');
    await verifyGithubAccount(account, page, waitForLoad);
    console.error('verified github account');
    await signupForTravisCI(account, page, waitForLoad);
    console.error('signed up for travis ci');
    await page.render('result.pdf');

    await phantomInstance.exit();
    return account;
}

module.exports = {signupAndVerifyGithub: signupAndVerifyGithub};
