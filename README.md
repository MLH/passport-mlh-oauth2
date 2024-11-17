# passport-mlh-oauth2
[![npm version](https://badge.fury.io/js/@mlhacks%2Fpassport-mlh-oauth2.svg)](https://badge.fury.io/js/@mlhacks%2Fpassport-mlh-oauth2)
[![Build Status](https://github.com/MLH/passport-mlh-oauth2/actions/workflows/node.js.yml/badge.svg)](https://github.com/MLH/passport-mlh=oauth2/actions/workflows/node.js.yml)

This is the official [Passport.js](http://www.passportjs.org/) strategy for authenticating with [MyMLH](https://my.mlh.io) in Node.js applications. To use it, you'll need to [register an application](https://my.mlh.io/developers) and obtain an OAuth Application ID and Secret from MyMLH.

It now supports MyMLH API V4. [Read the MyMLH V4 docs here](https://my.mlh.io/developers/docs).

## Requirements

This module requires Node.js version `14.0.0` or higher.

## Installation

Install the package via npm:

```bash
npm install passport-mlh-oauth2
```

## Usage

### Configure Strategy

You can find a list of potential scopes and expandable fields in the [MyMLH API documentation](https://my.mlh.io/developers/docs). The defaults below are provided simply as an example.

```javascript
const passport = require('passport');
const MLHStrategy = require('passport-mlh');

passport.use(new MLHStrategy({
    clientID: process.env.MY_MLH_KEY,
    clientSecret: process.env.MY_MLH_SECRET,
    callbackURL: 'https://www.example.net/auth/mlh/callback',
    scope: 'public offline_access user:read:profile',
    expandFields: ['education']
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this callback, you can process the profile data and decide what to do with it.
    // For example, you might save the user to your database.
    User.findOrCreate({ mlhId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

### Authenticate Requests

Use `passport.authenticate()` middleware to authenticate requests.

```javascript
app.get('/auth/mlh',
  passport.authenticate('mlh'));

app.get('/auth/mlh/callback', 
  passport.authenticate('mlh', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

### Accessing User Data

After successful authentication, the `profile` object returned by the strategy contains the user's MyMLH profile information. The profile has the following properties:

- `provider` - always set to `mlh`
- `id` - the user's MyMLH ID
- `first_name` - the user's first name
- `last_name` - the user's last name
- `email` - the user's email address
- Other fields as per the scopes and expand fields you have requested.

Example:

```javascript
app.get('/auth/mlh/callback', 
  passport.authenticate('mlh', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    console.log(req.user);
    res.redirect('/');
  });
```

You can access user information in your route handlers using `req.user`.

```javascript
app.get('/profile', ensureAuthenticated, function(req, res){
  const user = req.user;
  const firstName = user.first_name;
  res.render('profile', { user: user });
});
```

You can find the full User object structure in the [MyMLH API documentation](https://my.mlh.io/developers/docs).

## Options

- `clientID` - Your MyMLH application's client ID.
- `clientSecret` - Your MyMLH application's client secret.
- `callbackURL` - URL to which MyMLH will redirect the user after granting authorization.
- `scope` - Space-separated list of permissions (e.g., `'public offline_access user:read:profile'`).
- `expandFields` - Optional array of fields to expand in the user profile (e.g., `['education', 'professional_experience']`).

## Questions?

Have a question about the API or this library? Start by checking out the [official MyMLH documentation](https://my.mlh.io/developers/docs). If you still can't find an answer, tweet at [@MLHacks](http://twitter.com/mlhacks) or drop an email to [engineering@mlh.io](mailto:engineering@mlh.io).
```
