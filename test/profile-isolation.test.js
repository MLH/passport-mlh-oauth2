// The regression test a maintainer would write for this report:
// "A second login on the same server gets the first user's profile."
// A Passport strategy is created once and shared by every request.
// Each login must get the profile for its own access token.
import { expect } from 'chai';
import { MLHStrategy } from '../lib/index.js';

describe('MLHStrategy profile isolation', function() {
  const users = {
    'token-jane': { id: '1', first_name: 'Jane', email: 'jane@example.com' },
    'token-sam': { id: '2', first_name: 'Sam', email: 'sam@example.com' }
  };

  function sharedStrategy() {
    const strategy = new MLHStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});
    // Stand in for the MyMLH API: answer with the user that owns the token.
    strategy._oauth2.get = (url, token, cb) => cb(null, JSON.stringify(users[token]));
    return strategy;
  }

  it('returns each user their own profile on one shared strategy', function(done) {
    const strategy = sharedStrategy();

    strategy.userProfile('token-jane', function(err, jane) {
      if (err) return done(err);
      strategy.userProfile('token-sam', function(err, sam) {
        if (err) return done(err);

        expect(jane.id).to.equal('1');
        expect(sam.id, 'second login got the first login\'s profile').to.equal('2');
        expect(sam.email).to.equal('sam@example.com');
        done();
      });
    });
  });

  it('still reports the provider as mlh', function(done) {
    sharedStrategy().userProfile('token-jane', function(err, profile) {
      if (err) return done(err);
      expect(profile.provider).to.equal('mlh');
      done();
    });
  });
});
