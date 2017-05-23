// NOTE: This will give you an error every time you insert this map until you specify a configuration for the 
// latitude and longitude index.

(function (CS) {
  'use strict';

  function gMapsVis() { }
  CS.deriveVisualizationFromBase(gMapsVis);

  gMapsVis.prototype.init = function (scope, element) {
    this.onDataUpdate = dataUpdate;
    this.onConfigChange = configChanged;
    this.onResize = resize;

    scope.markersList = [];
    scope.infoWindowList = [];

    var container = element.find('#container')[0];
    var id = "gmaps_" + Math.random().toString(36).substr(2, 16);
    container.id = id;
    scope.id = id;

    scope.forceFirstUpdate = true;

    function dataUpdate(data) {
      if ((data == null) || (data.Rows.length == 0)) {
        return;
      }
      if (scope.map != undefined) {
        if ((scope.forceFirstUpdate == true) && (Object.keys(scope.config.ElementsList).length > 0)) {
          scope.forceFirstUpdate = false;
          createMarkers(data, true);
        }
        if (data.Rows[0].Path) {
          createMarkers(data, false);
        }
        updateMarkersLocation(data);
      }
    }

    function updateMarkersSettings (marker, infowindow, infowindowContent, config) {
     // if (config.MarkerColor != 'rgb(255,0,0)') {  
       // marker.setIcon('https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + config.MarkerColor.substr(1));  
      //}  
      infowindow.close();  
      // google.maps.event.addListener(marker, 'mouseover', (function (marker) {  
      //   return function () {  
      //     if ((scope.config.OpenInfoBox == true) && (infowindowContent != null)) {  
      //       infowindow.setContent(infowindowContent);  
      //       infowindow.open(scope.map, marker);  
      //     }  
      //   }  
      // })(marker)); 
    }

    function createMarkers (data, useConfigData) {  
      if (useConfigData == false) {  
        for (var i = 0; i < data.Rows.length; i++) {  
          var splitResult = data.Rows[i].Label.split('|');  
          if ((splitResult[1] == scope.config.LatName) || (splitResult[1] == scope.config.LngName) || (splitResult[1] == scope.config.MapAttr)) {  
            if (scope.config.ElementsList[splitResult[0]] == undefined) {  
              scope.config.ElementsList[splitResult[0]] = new Object();  
              scope.config.ElementsList[splitResult[0]].MarkerCreated = false;  
              scope.config.ElementsList[splitResult[0]].MarkerIndex = -1;  
              scope.config.ElementsList[splitResult[0]].LatIndex = null;  
              scope.config.ElementsList[splitResult[0]].LngIndex = null;
              scope.config.ElementsList[splitResult[0]].MapAttrIndex = null;  
            }  
            if (splitResult[1] == scope.config.LatName) {  
              scope.config.ElementsList[splitResult[0]].LatIndex = i;  
            }  
            if (splitResult[1] == scope.config.LngName) {  
              scope.config.ElementsList[splitResult[0]].LngIndex = i;  
            } 
            if (splitResult[1] == scope.config.MapAttr) {  
              scope.config.ElementsList[splitResult[0]].MapAttrIndex = i;  
            } 
          }  
        }  
      }  
      for (var key in scope.config.ElementsList) {  
        var currentElement = scope.config.ElementsList[key];  
        if ((currentElement.MarkerCreated == false) || (scope.markersList[currentElement.MarkerIndex] == undefined)) {  
          if ((currentElement.LatIndex != null) && (currentElement.LngIndex != null)) {

            var icon = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|';
          //  console.log('currentElement.MapAttr',currentElement);
            var val = parseInt(data.Rows[currentElement.MapAttrIndex].Value); 
            switch(true){
              case (val == scope.config.Limits.Min):  
                  icon += scope.config.COLORS.Min.substr(1);
                  break;
              case (val < scope.config.Limits.LoLo):  
                  icon += scope.config.COLORS.MintoLoLo.substr(1);
                  break;
              case (val < scope.config.Limits.Lo): 
                  icon += scope.config.COLORS.LoLotoLo.substr(1);
                  break;
              case (val < scope.config.Limits.Hi): 
                  icon += scope.config.COLORS.LotoHi.substr(1);
                  break;
              case (val < scope.config.Limits.HiHi): 
                  icon += scope.config.COLORS.HitoHiHi.substr(1);
                  break;
              case (val < scope.config.Limits.Max): 
                  icon += scope.config.COLORS.HiHitoMax.substr(1);
                  break;
              default:
                  icon += scope.config.COLORS.BadData.substr(1);
                  break;
            }

            var marker = new google.maps.Marker({  
              position: { lat: parseFloat(data.Rows[currentElement.LatIndex].Value), lng: parseFloat(data.Rows[currentElement.LngIndex].Value) },  
              map: scope.map,  
              title: 'Asset: '+ key +'\n' + 'Health: ' + data.Rows[currentElement.MapAttrIndex].Value +'%',
              icon: icon  
            });  
          //  console.log('marker',marker);
            var infowindow = new google.maps.InfoWindow();  
            scope.markersList.push(marker);  
            scope.infoWindowList.push(infowindow);  
            updateMarkersSettings(marker, infowindow, key, scope.config);  
            currentElement.MarkerCreated = true;  
            currentElement.MarkerIndex = scope.markersList.length - 1;  
          }  
          else {  
            alert('Could not find the latitude and longitude attributes');  
          }  
        }  
      }  
    }  





    function updateMarkersLocation (data) {
      var markersCount = 0;  
      var currentLatLng = null;  
      for (var key in scope.config.ElementsList) {  
        var currentElement = scope.config.ElementsList[key];  
        if (currentElement.MarkerCreated == true) {  
          currentLatLng = { lat: parseFloat(data.Rows[currentElement.LatIndex].Value), lng: parseFloat(data.Rows[currentElement.LngIndex].Value) };  
          var marker = scope.markersList[parseInt(currentElement.MarkerIndex)];  
          marker.setPosition(currentLatLng);  
          markersCount++;  
        }  
      }  
      if (markersCount == 1) {  
        scope.map.setCenter(currentLatLng);  
      }  
      if (markersCount > 1) {  
        var latlngbounds = new google.maps.LatLngBounds();  
        for (var i = 0; i < scope.markersList.length; i++) {  
          latlngbounds.extend(scope.markersList[i].getPosition());  
        }  
        if (scope.config.FitBounds == true) {  
          scope.map.fitBounds(latlngbounds);  
        }  
      } 


      for (var key in scope.config.ElementsList) {  
        var currentElement = scope.config.ElementsList[key];

            var icon = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|';
          //  console.log('currentElement.MapAttr',currentElement);
            var val = parseInt(data.Rows[currentElement.MapAttrIndex].Value); 
            switch(true){
              case (val == scope.config.Limits.Min):  
                  icon += scope.config.COLORS.Min.substr(1);
                  break;
              case (val < scope.config.Limits.LoLo):  
                  icon += scope.config.COLORS.MintoLoLo.substr(1);
                  break;
              case (val < scope.config.Limits.Lo): 
                  icon += scope.config.COLORS.LoLotoLo.substr(1);
                  break;
              case (val < scope.config.Limits.Hi): 
                  icon += scope.config.COLORS.LotoHi.substr(1);
                  break;
              case (val < scope.config.Limits.HiHi): 
                  icon += scope.config.COLORS.HitoHiHi.substr(1);
                  break;
              case (val < scope.config.Limits.Max): 
                  icon += scope.config.COLORS.HiHitoMax.substr(1);
                  break;
              default:
                  icon += scope.config.COLORS.BadData.substr(1);
                  break;
            }
            var marker = scope.markersList[parseInt(currentElement.MarkerIndex)]; 
          //  console.log(marker); 


            marker.setIcon(icon);  

            var title = 'Asset: '+ key +'\n' + 'Health: ' + data.Rows[currentElement.MapAttrIndex].Value +'%';
            marker.setTitle(title);


      }





    }

    function configChanged(config) {
      if (scope.map != undefined) {
        scope.map.setOptions({
          disableDefaultUI: config.DisableDefaultUI,
          zoomControl: config.ZoomControl,
          scaleControl: config.ScaleControl,
          streetViewControl: config.StreetViewControl,
          mapTypeControl: config.MapTypeControl,
          mapTypeId: getMapTypeId(config.MapTypeId),
        });
        if ((config.FitBounds == false) || (scope.markersList.length === 1)) {
          scope.map.setOptions({
            zoom: parseInt(config.ZoomLevel)  
          });
        }
      }
      for (var i = 0; i < scope.markersList.length; i++) {
        var marker = scope.markersList[i];
        updateMarkersSettings(marker, scope.infoWindowList[i], getInfowindowContent(i), config);
      }
    };

    function getMapTypeId (mapTypeIdString) {
      if (mapTypeIdString == 'HYBRID') {
          return google.maps.MapTypeId.HYBRID;
      }
      else if (mapTypeIdString == 'ROADMAP') {
          return google.maps.MapTypeId.ROADMAP;
      }
      else if (mapTypeIdString == 'SATELLITE') {
          return google.maps.MapTypeId.SATELLITE;
      }
      else if (mapTypeIdString == 'TERRAIN') {
          return google.maps.MapTypeId.TERRAIN
      }
      else {
          return null;
      }
    }

    function getInfowindowContent (i) {
      for (var key in scope.config.ElementsList) {
        var currentElement = scope.config.ElementsList[key];
        if (currentElement.MarkerIndex == i) {
          return key;
        }
      }
      return null;
    }

    function resize(width, height) {
      // if (scope.map != undefined) {
      //   if (scope.map != undefined) {
      //     google.maps.event.trigger(scope.map, "resize");
      //   }
      // }
    }

    function startGoogleMaps () {
      if (scope.map == undefined) {
        scope.map = new window.google.maps.Map(document.getElementById(scope.id), {
          center: { lat: 0, lng: 0 },
          zoom: 1
        });
      }
      configChanged(scope.config);
    };

    function loadGoogleMaps() {
      if (window.google == undefined) {
        if (window.googleRequested) {
          setTimeout(function () {
            window.gMapsCallback();
          }, 3000);

        }
        else {
          var script_tag = document.createElement('script');
          script_tag.setAttribute("type", "text/javascript");  
          script_tag.setAttribute("src", "https://maps.google.com/maps/api/js?callback=gMapsCallback&key=AIzaSyCbJjs2I4wjn2wQAxUxvDjCV4_KmHRBcH8");  
          (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);  
          window.googleRequested = true;
        }
      }
      else {
        window.gMapsCallback();
      }
    }

    window.gMapsCallback = function () {
      $(window).trigger('gMapsLoaded');
    }
    $(window).bind('gMapsLoaded', startGoogleMaps);
    loadGoogleMaps();

  };

  var def = {
    typeName: 'gmaps',
    datasourceBehavior: CS.Extensibility.Enums.DatasourceBehaviors.Multiple,
    iconUrl: 'Images/google-maps.svg',
    visObjectType: gMapsVis,
    getDefaultConfig: function() {
      return {
        DataShape: 'Table',
        Height: 400,
        Width: 400,
        MarkerColor: 'rgb(255,0,0)',
        LatName: 'Latitude',
        LngName: 'Longitude',
        MapAttr: 'Health Index',
        OpenInfoBox: true,
        ZoomLevel: 8,
        DisableDefaultUI: false,
        ZoomControl: true,
        ScaleControl: true,
        StreetViewControl: true,
        MapTypeControl: true,
        MapTypeId: 'ROADMAP',
        FitBounds: true,
        ElementsList: {},
        COLORS: {
          BadData: '#333333',
          Min: '#ff0000',
          MintoLoLo: '#ff0000',
          LoLotoLo: '#ff0000',
          LotoHi: '#ff0000',
          HitoHiHi: '#ffff00',
          HiHitoMax: '#7fff00'
        },
        Limits:{
          Min: 0,
          LoLo: 10,
          Lo: 25,
          Hi: 75,
          HiHi: 88,
          Max: 100
        }
      };
    },
    configOptions: function() {
      return [{
        title: 'Format Symbol',
        mode: 'format'
      }];
    }
  }
  CS.symbolCatalog.register(def);

})(window.PIVisualization);