var express = require('express');
var app = express();
app.use(express.static(__dirname + '/'));

app.listen(9000);

var request = require('request');
const {
    google
} = require('googleapis');

const googleConfig = {
    clientId: 'xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
    clientSecret: 'yyyyyyyyyyyyyyyyyyyyyyy',
    redirect: 'https://yourwebsite.com/oauthcallback', // this must match your google api settings
};

const defaultScope = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.email',
];

function createConnection() {
    return new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirect
    );
}

function getConnectionUrl(auth) {
    return auth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // 'consent select_account',
        scope: defaultScope,
        page: "home"
    });
}

function getGooglePlusApi(auth) {
    return google.plus({
        version: 'v1',
        auth
    });
}


function urlGoogle() {
    const auth = createConnection();
    const url = getConnectionUrl(auth);
    return url;
}

/**
 * Part 1: Create a Google URL and send to the client to log in the user.
 */

console.log(urlGoogle());



app.get('/', function(req, res) {

    res.sendFile(__dirname + "/login.html");

});


function validate(req) {
    var obj = new Object();

    var options = {
        method: 'GET',
        url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + req.query.token,
        headers: {
            'content-type': 'application/json'
        },

    };

    return new Promise((resolve, reject) => {

        request(options, function(error, response, body) {
            if (error)
                reject(new Error(error));
            var userdata = JSON.parse(body);

            if (userdata.email) {
                obj.result = true;
                obj.email = userdata.email;
                obj.alldata = userdata;
            } else {
                obj.result = false;
            }
            resolve(obj);

        });

    });


}


app.get("/oauthcallback", (req, res) => {

    var oauth2Client = createConnection();

    var code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {

        if (!err) {
            oauth2Client.setCredentials(tokens);

            req.query.token = tokens.access_token;
            var initializePromise = validate(req);

            initializePromise.then(function(result) {
                console.log('USER data : ');
                console.log(result);

                res.sendFile(__dirname + "/mainpage.html");
            }, function(err) {
                res.redirect("/");
            })

        } else {
            res.redirect("/");
        }
    });

});