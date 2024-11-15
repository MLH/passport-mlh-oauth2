import { expect } from 'chai';
import { MLHStrategy } from '../lib/index.js';

describe('MLHStrategy', function() {
  describe('constructor', function() {
    it('should be named mlh', function() {
      const strategy = new MLHStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});
      expect(strategy.name).to.equal('mlh');
    });

    it('should initialize with default options', function() {
      const strategy = new MLHStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._oauth2._authorizeUrl).to.equal('https://my.mlh.io/oauth/authorize');
      expect(strategy._oauth2._accessTokenUrl).to.equal('https://my.mlh.io/oauth/token');
      expect(strategy._profileURL).to.equal('https://api.mlh.com/v4/users/me');
    });
  });

  describe('_buildApiUrl', function() {
    it('should return base URL when no expand fields', function() {
      const strategy = new MLHStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._buildApiUrl()).to.equal('https://api.mlh.com/v4/users/me');
    });

    it('should include expand fields in URL when specified', function() {
      const strategy = new MLHStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret',
        expandFields: ['education', 'professional_experience']
      }, function() {});

      const url = strategy._buildApiUrl();
      expect(url).to.include('expand[]=education');
      expect(url).to.include('expand[]=professional_experience');
    });
  });

  describe('userProfile', function() {
    it('should normalize profile', function(done) {
      const strategy = new MLHStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      strategy._data = {
        id: '123',
        first_name: 'Jane',
        last_name: 'Hacker',
        email: 'jane@example.com',
        phone_number: '+1234567890'
      };

      strategy.userProfile('token', function(err, profile) {
        if (err) return done(err);

        expect(profile.provider).to.equal('mlh');
        expect(profile.id).to.equal('123');
        expect(profile.first_name).to.equal('Jane');
        expect(profile.last_name).to.equal('Hacker');
        expect(profile.email).to.equal('jane@example.com');
        expect(profile.phone_number).to.equal('+1234567890');
        done();
      });
    });
  });
});
