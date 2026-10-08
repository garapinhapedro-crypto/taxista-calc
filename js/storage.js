/**
 * Camada de persistência — localStorage apenas, com defaults seguros
 * para dados ausentes ou corrompidos.
 */
(function (global) {
  'use strict';

  var KEYS = {
    trips: 'taxista_trips_v1',
    settings: 'taxista_settings_v1'
  };

  var DEFAULT_SETTINGS = {
    defaultTaxPercent: 10,
    defaultMarginPercent: 10,
    defaultRatePerKm: null,
    drivers: [],
    theme: 'system'
  };

  function safeParse(json, fallback) {
    if (!json) return fallback;
    try {
      var parsed = JSON.parse(json);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      console.warn('Dados corrompidos em localStorage, usando padrão.', e);
      return fallback;
    }
  }

  function getTrips() {
    var trips = safeParse(localStorage.getItem(KEYS.trips), []);
    if (!Array.isArray(trips)) return [];
    return trips;
  }

  function saveTrips(trips) {
    try {
      localStorage.setItem(KEYS.trips, JSON.stringify(trips));
      return true;
    } catch (e) {
      console.error('Falha ao salvar viagens (localStorage cheio?)', e);
      return false;
    }
  }

  function addTrip(trip) {
    var trips = getTrips();
    trip.id = trip.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    trips.unshift(trip);
    saveTrips(trips);
    return trip;
  }

  function updateTrip(id, patch) {
    var trips = getTrips();
    var idx = trips.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return null;
    trips[idx] = Object.assign({}, trips[idx], patch);
    saveTrips(trips);
    return trips[idx];
  }

  function deleteTrip(id) {
    var trips = getTrips().filter(function (t) { return t.id !== id; });
    saveTrips(trips);
  }

  function getSettings() {
    var s = safeParse(localStorage.getItem(KEYS.settings), {});
    var merged = Object.assign({}, DEFAULT_SETTINGS, s && typeof s === 'object' ? s : {});
    merged.drivers = Array.isArray(merged.drivers) ? merged.drivers.slice() : [];
    return merged;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(KEYS.settings, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Falha ao salvar configurações.', e);
      return false;
    }
  }

  function exportBackup() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      trips: getTrips(),
      settings: getSettings()
    };
  }

  function importBackup(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Arquivo de backup inválido.');
    }
    if (Array.isArray(data.trips)) {
      saveTrips(data.trips);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveSettings(Object.assign({}, DEFAULT_SETTINGS, data.settings));
    }
  }

  global.TaxistaStorage = {
    getTrips: getTrips,
    saveTrips: saveTrips,
    addTrip: addTrip,
    updateTrip: updateTrip,
    deleteTrip: deleteTrip,
    getSettings: getSettings,
    saveSettings: saveSettings,
    exportBackup: exportBackup,
    importBackup: importBackup,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})(typeof window !== 'undefined' ? window : this);
