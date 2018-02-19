const appRoot   = require('app-root-path');
const PhantomUtils  = require(appRoot+'/core/phantomUtils');

async function getArguments() {
    var arguments = process.argv.slice(2);
    var account = {};
    account.username = arguments[0];
    account.password = arguments[1];
    account.email = arguments[2];
    account.repositoryName = arguments[3];
    return account;
}

var signInToCircle = async function(account, page, loadWaitFunction) {
    var waitForLoad = loadWaitFunction;

    await page.open('https://circleci.com/login');
    await waitForLoad();
    await page.evaluate(function(account) {
        var usernameElement = document.getElementById('login_field');
        var passwordElement = document.getElementById('password');

        usernameElement.value = account.username;
        passwordElement.value = account.password;

        var forms = document.getElementsByTagName("form");
        var form = null;
        for(var i=0; i<forms.length; ++i) {
            if(forms[i].action.indexOf('session') !== -1) {
                form = forms[i];
                break ;
            }
        }
        if(form)
            form.submit();
    }, account);
    await waitForLoad();
    page.evaluate(function() {
        console.log('moez: url: '+document.URL);
        var button = document.getElementById('js-oauth-authorize-btn');
        button.disabled=false;
        button.click();
    });
    await waitForLoad();
}

async function activate() {
    try {
        var o = await PhantomUtils.setupPhantom();
        var phantomInstance = o.phantomInstance;
        var page = o.page;
        var waitForLoad = o.waitForLoad;

        var account = await getArguments();
        await signInToCircle(account, page, waitForLoad);

        await page.open('https://circleci.com/api/v1/user/token');
        await waitForLoad();
        page.evaluate(function() {
            console.log('moez: when tokens get called:');
            console.log(document.documentElement.outerHTML);
        });
        await page.render('viewLabels.pdf');

        var status = await page.open('https://circleci.com/api/v1/user/token', 'post', {label: "salam"});
        console.log("moez: status: "+status);
        await waitForLoad();
        page.evaluate(function() {
            console.log('moez: when tokens post called:');
            console.log(document.documentElement.outerHTML);
        });
        await page.render('step.pdf');

        phantomInstance.exit();

    } catch(error) {
        console.trace('error happened: '+error);
        process.exit(1);
    }
}

activate();
