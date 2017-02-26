
(function () {
  'use strict';

  angular.module('zAdmin.storage')
	.service('storageService', storageService);

	/** @ngInject */
	function storageService() {

		var storage = {
		    
		    saveInLocalStorage: function(key,value){
		      localStorage.setItem(key, value);
		    },
		    deleteFromLocalStorage: function(key){
		      localStorage.removeItem(key);
		    },
		    getFromLocalStorage: function(key){
		      return localStorage.getItem(key);
		    },
		    saveObjectInLocalStorage: function(key, value){
		      localStorage.setItem(key, JSON.stringify(value));
		    },
		    getObjectFromLocalStorage: function(key){
		      return JSON.parse(localStorage.getItem(key));
		    },
		    clearLocalStorage: function(){
		      localStorage.clear();
		    }
		}

		return storage;
	}

})();