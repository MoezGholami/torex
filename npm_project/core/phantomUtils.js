const appRoot   = require('app-root-path');
const phantom   = require('phantom');

function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
}

var setupPhantom = async function() {
    const nolog = function() {}, yeslog = console.log;
    var log = nolog;
    var operationInProgress = false;
    var phantomInstance = await phantom.create(['--cookies-file=cookies.txt', '--ssl-protocol=any'], { phantomPath: appRoot+'/node_modules/phantomjs-prebuilt/bin/phantomjs',
        logger: { warn: log, debug: log, error: log } });
    var page = await phantomInstance.createPage();
    page.setting('userAgent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36');
    page.customHeaders = {}

    page.on('onLoadStarted' , function() { operationInProgress = true ; });
    page.on('onLoadFinished', function() { operationInProgress = false; });
    page.on('onConsoleMessage', function(msg, lineNum, sourceId) {
      console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    });
    var waitForLoad = async function() {
        var interval;
        var p = new Promise((resolve, reject)=>{
            interval = setInterval(function(){
                if(!operationInProgress)
                    resolve();
            }, 100);
        });
        await p;
        clearInterval(interval);
    };
    return {phantomInstance: phantomInstance, page: page, waitForLoad: waitForLoad};
}

module.exports={delay: delay, setupPhantom: setupPhantom};
