const appRoot       = require('app-root-path');
const nodemailer    = require('nodemailer');
const Imap          = require('imap');
const simpleParser  = require('mailparser').simpleParser;
const inspect       = require('util').inspect;

var createEmail = function() {
    return new Promise((resolve, reject) => {
        nodemailer.createTestAccount((error, emailAccount) => {
            if(error)
                reject(error);
            else {
                var account         = emailAccount;
                account.email       = account.user;
                account.username    = account.email.split('@')[0];
                account.password    = account.pass;
                resolve(account);
            }
        });
    });
};

var fetchEmails = function(emailAccount) {
    var config = {
        user: emailAccount.email,
        password: emailAccount.password,
        host: emailAccount.imap.host,
        port: emailAccount.imap.port,
        tls: emailAccount.imap.secure
    };

    return new Promise((resolve, reject) => {

        var emails = [], currentEmail = {};
        var imap = new Imap(config);

        imap.once('error', reject);
        imap.once('end', () => { resolve(emails); });
        imap.once('ready', () => {
            imap.openBox('INBOX', true,function(error, box) {
                if (error) 
                    reject(error);

                var f = imap.seq.fetch(box.messages.total + ':*', { bodies: ['HEADER.FIELDS (FROM)','TEXT'] });
                f.once('error', (error) => { reject(error); });
                f.once('end', () => { imap.end(); } );

                f.on('message', function(msg, seqno) {
                    currentEmail.seqno = seqno;
                    msg.on('body', function(stream, info) {
                        var buffer = '', count = 0;
                        simpleParser(stream, (error, parsedEmail) => {
                            if(error)
                                reject(error);
                            currentEmail = Object.assign(currentEmail, parsedEmail);
                            if (currentEmail)
                                emails.push(currentEmail);
                            currentEmail = {};
                        });
                    });
                    msg.once('attributes', (attributes) => { currentEmail.attributes = inspect(attributes, false, 8); });
                });
            });
        });
        imap.connect();
    });
};

module.exports = {fetchEmails: fetchEmails, createEmail: createEmail};
