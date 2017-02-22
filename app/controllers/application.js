import Ember from 'ember';

const { inject } = Ember;

export default Ember.Controller.extend({
  localStorage: inject.service()
});
