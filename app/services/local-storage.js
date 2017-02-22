import Ember from 'ember';
import ENV from 'local-storage-throughput/config/environment';
import {task} from 'ember-concurrency';

const {inject, $} = Ember;

export default Ember.Service.extend({
  ajax: inject.service(),
  // broadcast app id with instance id

  /**
   * JSON object with the state of all windows
   * @property state
   */
  state: null,

  init() {
    this._super(...arguments);

    const localStorageKey = ENV['local-storage-throughput'].localStorageKey;
    window.addEventListener('storage', (e) => {
      if (e.key === localStorageKey) {
        this.get('updateCrossApplicationState').perform(e.newValue);
      }
    });

    this.get('addKeyToBlob').perform(localStorageKey);
  },

  addKeyToBlob: task(function *(localStorageKey) {
    const url = localStorage[localStorageKey];
    let urlForBlob = url ? url : URL.createObjectURL(this.emptyJSONBlob());
    let jsonData;
    try {
      jsonData = yield $.getJSON(urlForBlob);
    } catch (e) {
      jsonData = this.emptyJSON();
    }
    const windowKey = this.generateNewWindowKey();
    jsonData.registry.push(windowKey);

    const blob = this.createBlob(jsonData);
    const newUrl = URL.createObjectURL(blob);
    localStorage.setItem(localStorageKey, newUrl);
    this.set('windowKey', windowKey);
  }),

  updateCrossApplicationState: task(function *(urlForBlob) {
    const jsonData = yield $.getJSON(urlForBlob);
    this.set('state', jsonData);
    return jsonData;
  }),

  emptyJSON() {
    return {registry: []};
  },

  emptyJSONBlob() {
    return new Blob([JSON.stringify(this.emptyJSON())], {type: 'application/json'});
  },

  createBlob(json) {
    return new Blob([JSON.stringify(json)], {type: 'application/json'});
  },

  generateNewWindowKey() {
    // TODO would need some sort of app id as a salt
    return 'lst-w' + (new Date().toISOString())
  }


});
