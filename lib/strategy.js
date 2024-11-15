/**
 * Module dependencies.
 */
import OAuth2Strategy from 'passport-oauth2';

/**
 * `MLHStrategy` constructor.
 *
 * The MyMLH authentication strategy authenticates requests by delegating to
 * MyMLH using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `clientID`      your MyMLH application's client id
 *   - `clientSecret`  your MyMLH application's client secret
 *   - `callbackURL`   URL to which MyMLH will redirect the user after granting authorization
 *   - `expandFields`  optional array of fields to expand in the user profile
 *   - `scope`         space-separated list of permissions (e.g., 'public offline_access user:read:profile')
 *
 * Examples:
 *
 *     passport.use(new MLHStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/mlh/callback',
 *         expandFields: ['education', 'professional_experience']
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
class MLHStrategy extends OAuth2Strategy {
  constructor(options, verify) {
    options = options || {};
    options.authorizationURL = options.authorizationURL || 'https://my.mlh.io/oauth/authorize';
    options.tokenURL = options.tokenURL || 'https://my.mlh.io/oauth/token';
    options.scopeSeparator = ' ';  // Force space separator for MLH scopes
    options.customHeaders = options.customHeaders || {};
    options.authScheme = 'request-body';  // Match Ruby implementation

    if (!options.customHeaders['User-Agent']) {
      options.customHeaders['User-Agent'] = options.userAgent || 'passport-mlh-oauth2';
    }

    // Ensure scope is properly formatted
    if (options.scope && typeof options.scope === 'string') {
      // Split on any whitespace and rejoin with single spaces
      options.scope = options.scope.split(/\s+/).join(' ');
    }

    super(options, verify);
    this.name = 'mlh';
    this._options = options;
    this._profileURL = options.profileURL || 'https://api.mlh.com/v4/users/me';
    this._oauth2.useAuthorizationHeaderforGET(true);
  }

  /**
   * Retrieve user profile from MyMLH.
   *
   * This function constructs a normalized profile, with the following properties:
   *
   *   - `provider`         always set to `mlh`
   *   - `id`              the user's MyMLH ID
   *   - `displayName`     the user's full name
   *   - `name.familyName` the user's last name
   *   - `name.givenName`  the user's first name
   *   - `emails`          the user's email addresses
   *   - `phoneNumbers`    the user's phone numbers
   *
   * @param {string} accessToken
   * @param {function} done
   * @access protected
   */
  userProfile(accessToken, done) {
    this._accessToken = accessToken;

    this.data((err, data) => {
      if (err) { return done(err); }

      try {
        const profile = {
          provider: 'mlh',
          ...data
        };

        done(null, profile);
      } catch (e) {
        done(e);
      }
    });
  }

  /**
   * Return the MyMLH user ID.
   *
   * @return {String}
   * @api protected
   */
  uid() {
    return this._data.id;
  }

  /**
   * Retrieve and process user data from MyMLH.
   *
   * @param {function} done
   * @api protected
   */
  data(done) {
    if (this._data) {
      return done(null, this._data);
    }

    const url = this._buildApiUrl();

    this._oauth2.get(url, this._accessToken, (err, body) => {
      if (err) { return done(null, {}); }

      try {
        const json = JSON.parse(body);
        this._data = this._processData(json);
        done(null, this._data);
      } catch (e) {
        done(null, {});
      }
    });
  }

  /**
   * Build the MyMLH API URL with optional expand fields.
   *
   * @return {String}
   * @api private
   */
  _buildApiUrl() {
    const url = this._profileURL;
    const expandFields = this._options.expandFields || [];

    if (!expandFields.length) return url;

    const expandQuery = expandFields
      .map(field => `expand[]=${encodeURIComponent(field)}`)
      .join('&');

    return `${url}?${expandQuery}`;
  }

  /**
   * Process and normalize the MyMLH API response data.
   *
   * @param {Object} data
   * @return {Object}
   * @api private
   */
  _processData(data) {
    if (!data || typeof data !== 'object') return {};
    return this._symbolizeNestedArrays(data);
  }

  /**
   * Deep transform object keys and handle nested arrays.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */
  _symbolizeNestedArrays(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this._symbolizeNestedArrays(item));
    }

    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this._symbolizeNestedArrays(value);
      }
      return result;
    }

    return obj;
  }
}

/**
 * Expose `MLHStrategy`.
 */
export default MLHStrategy;
