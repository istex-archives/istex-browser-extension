(function() {
  'use strict';
  var LAST_REFRESH = 'istex-last-refresh'
  ;

  /**
   * nettoie Storage si la donnée la plus ancienne à plus d'un jour.
   * @returns null
   */
  if (!Storage.prototype.refreshIfNeeded) {
    Storage.prototype.refreshIfNeeded = function() {
      var
        DAY         = 86400000,
        lastRefresh = this.getLastRefresh(),
        refreshTime = DAY
      ;

      if (!lastRefresh || +lastRefresh + refreshTime < Date.now()) {
        this.refresh();
      }
    };
  }

  if (!Storage.prototype.getLastRefresh) {
    Storage.prototype.getLastRefresh = function() {
      return this.getItem(LAST_REFRESH);
    };
  }

  if (!Storage.prototype.setLastRefresh) {
    Storage.prototype.setLastRefresh = function() {
      return this.setItemOrClear(LAST_REFRESH, Date.now());
    };
  }

  if (!Storage.prototype.refresh) {
    Storage.prototype.refresh = function() {
      this.clear();
      this.setLastRefresh();
    };
  }


  if (!Storage.prototype.setItemOrCLear) {
    Storage.prototype.setItemOrClear = function(keyName, keyValue) {
      try {
        this.setItem(keyName, keyValue);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          this.refresh();
        } else {
          throw e;
        }
      }
    };
  }

  /**
   * Sature le storage. Permet essentiellement de faire des tests.
   */
  if (!Storage.prototype.saturate) {
    Storage.prototype.saturate = function() {
      var i = 1;
      while (i < 7500) {
        try {
          localStorage.setItem(i,
                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mollis neque felis, in efficitur tortor vestibulum id. Sed vitae lectus volutpat, vehicula quam id, condimentum lorem. Maecenas nec mauris eu risus posuere ultricies. Integer in ultrices sem. In tincidunt bibendum maximus. Proin consectetur elit orci, maximus suscipit mi finibus eu. Morbi aliquet urna eu diam mollis elementum. Maecenas tempor ultricies elit ac lacinia. Suspendisse pharetra eros suscipit vehicula pretium. Ut id iaculis nisi. In cursus felis ac dui malesuada malesuada. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce interdum, ante sit amet rhoncus commodo, turpis felis elementum ante, et viverra erat augue at urna. Vestibulum in tincidunt erat, vitae porta odio. Mauris commodo id diam vel vehicula.');
        }
        catch (e) {
          throw e;
        }
        ++i;
      }
    };
  }

}());
