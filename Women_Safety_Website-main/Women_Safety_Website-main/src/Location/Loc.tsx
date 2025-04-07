import { useState, useEffect, useRef } from "react";
import { Shield, AlertCircle, Info, Search, Map, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./Loc.css";
import { useNavigate } from "react-router-dom";

function useLiveLocation() {
  const [location, setLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState({ fullAddress: "Loading..." });
  const [status, setStatus] = useState("Detecting your location...");

  const getLocationDetails = async (lat: unknown, lng: unknown) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || "Address not available";
    } catch (error) {
      console.error("Error fetching location details:", error);
      return "Location details not available";
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported by your browser");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 3000,
          maximumAge: 0,
        });
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setLocation(newLocation);
      localStorage.setItem('lastKnownLocation', JSON.stringify(newLocation));
      const address = await getLocationDetails(newLocation.lat, newLocation.lng);
      setLocationDetails({ fullAddress: address });
      setStatus(`Location acquired (Accuracy: ${Math.round(newLocation.accuracy)}m)`);
    } catch (error) {
      setStatus(`Failed to detect location: ${error.message}`);
      const lastKnown = JSON.parse(localStorage.getItem('lastKnownLocation'));
      if (lastKnown) {
        setLocation(lastKnown);
        const address = await getLocationDetails(lastKnown.lat, lastKnown.lng);
        setLocationDetails({ fullAddress: address });
      }
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  return { location, locationDetails, status, refreshLocation: updateLocation, setLocation, setLocationDetails };
}

function MapComponent({ userLocation, policeStations, setPoliceStations, manualLocation, daughterLocation, setDaughterLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapView, setMapView] = useState('street');

  const safetyZones = {
    redZones: [
      { center: [userLocation?.lat + 0.01 || 0, userLocation?.lng + 0.01 || 0], radius: 500 },
      { center: [userLocation?.lat - 0.01 || 0, userLocation?.lng - 0.01 || 0], radius: 300 },
    ],
    blueZones: [
      { center: [userLocation?.lat + 0.005 || 0, userLocation?.lng + 0.005 || 0], radius: 400 },
      { center: [userLocation?.lat - 0.005 || 0, userLocation?.lng - 0.005 || 0], radius: 600 },
    ]
  };

  const fetchPoliceStations = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="police"](around:10000,${lat},${lng});way["amenity"="police"](around:10000,${lat},${lng}););out center;`
      );
      const data = await response.json();
      if (data.elements && data.elements.length > 0) {
        return data.elements.map(element => ({
          lat: element.lat || element.center.lat,
          lng: element.lon || element.center.lon,
          name: element.tags?.name || "Police Station",
          address: element.tags?.["addr:full"] || "Address not available",
          distance: L.latLng(lat, lng).distanceTo([element.lat || element.center.lat, element.lon || element.center.lon]) / 1000
        })).sort((a, b) => a.distance - b.distance);
      }
      
      const widerResponse = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="police"](around:30000,${lat},${lng});way["amenity"="police"](around:30000,${lat},${lng}););out center;`
      );
      const widerData = await widerResponse.json();
      return widerData.elements.map(element => ({
        lat: element.lat || element.center.lat,
        lng: element.lon || element.center.lon,
        name: element.tags?.name || "Police Station",
        address: element.tags?.["addr:full"] || "Address not available",
        distance: L.latLng(lat, lng).distanceTo([element.lat || element.center.lat, element.lon || element.center.lon]) / 1000
      })).sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error("Error fetching police stations:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        scrollWheelZoom: true,
      });

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        maxZoom: 19,
      });

      mapView === 'street' ? streetLayer.addTo(mapInstanceRef.current) : satelliteLayer.addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    
    const map = mapInstanceRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer || layer instanceof L.Marker || layer instanceof L.Routing.Control || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19,
    });

    mapView === 'street' ? streetLayer.addTo(map) : satelliteLayer.addTo(map);

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
    }).addTo(map).bindPopup(`
      Your Location<br>
      Lat: ${userLocation.lat.toFixed(6)}<br>
      Lng: ${userLocation.lng.toFixed(6)}
    `);

    if (daughterLocation) {
      const daughterMarker = L.marker([daughterLocation.lat, daughterLocation.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-pink.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(map).bindPopup(`
        Daughter's Location<br>
        Lat: ${daughterLocation.lat.toFixed(6)}<br>
        Lng: ${daughterLocation.lng.toFixed(6)}
      `);

      L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(daughterLocation.lat, daughterLocation.lng)
        ],
        lineOptions: { 
          styles: [{ 
            color: '#FF69B4',
            weight: 5,
            opacity: 0.7 
          }] 
        },
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        show: true,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        collapsible: true,
        createMarker: () => null,
      }).addTo(map);
    }

    safetyZones.redZones.forEach(zone => {
      L.circle(zone.center, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.3,
        radius: zone.radius
      }).addTo(map).bindPopup('High Risk Area');
    });

    safetyZones.blueZones.forEach(zone => {
      L.circle(zone.center, {
        color: 'blue',
        fillColor: '#2196F3',
        fillOpacity: 0.3,
        radius: zone.radius
      }).addTo(map).bindPopup('Safe Area');
    });

    fetchPoliceStations(userLocation.lat, userLocation.lng).then(stations => {
      setPoliceStations(stations);
      if (stations.length > 0) {
        const policeMarker = L.marker([stations[0].lat, stations[0].lng], {
          icon: L.divIcon({
            html: '<div style="color: #FFD700; font-size: 24px;">★</div>',
            className: 'star-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        }).addTo(map).bindPopup(`
          ${stations[0].name}<br>
          Lat: ${stations[0].lat.toFixed(6)}<br>
          Lng: ${stations[0].lng.toFixed(6)}
        `);

        L.Routing.control({
          waypoints: [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(stations[0].lat, stations[0].lng)
          ],
          lineOptions: { 
            styles: [{ 
              color: '#4682B4',
              weight: 5,
              opacity: 0.7 
            }] 
          },
          router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
          show: true,
          addWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: true,
          collapsible: true,
          createMarker: () => null,
          routeLine: function(route) {
            return L.polyline(route.coordinates, {
              color: '#4682B4',
              weight: 5,
              opacity: 0.7
            });
          }
        }).addTo(map);
      }
    });

    map.setView([userLocation.lat, userLocation.lng], 14);
  }, [userLocation, mapView, setPoliceStations, daughterLocation]);

  return (
    <div ref={mapRef} className="map-container">
      <div className="view-toggle-box">
        <button 
          onClick={() => setMapView(mapView === 'street' ? 'satellite' : 'street')}
          className={`view-toggle-button ${mapView === 'satellite' ? 'active' : ''}`}
        >
          {mapView === 'street' ? 'Satellite' : 'Street'}
        </button>
      </div>
    </div>
  );
}

function WelcomePage({ onEnter }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = async () => {
    if (!name || !role) {
      alert("Please enter your name and select a role");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const userData = {
        name,
        role,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const response = await fetch('https://backend-gut6.onrender.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(userData));
        document.querySelector('.welcome-page')?.classList.add('zoom-out-3d');
        setTimeout(() => onEnter(), 1000);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to save data. Please try again.");
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <Shield size={90} className="welcome-icon" />
        <h1>Women's Safety Guardian</h1>
        <p>Empowering Your Safety with Confidence</p>
        <div className="wel">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="name-input"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-select"
          >
            <option value="">Select role</option>
            <option value="parent">Parent</option>
            <option value="daughter">Daughter</option>
          </select>
        </div>
        <button onClick={handleSubmit} className="get-started-button">
          Get Started
        </button>
      </div>
    </div>
  );
}

function Loc() {
  const { location, locationDetails, status, refreshLocation, setLocation, setLocationDetails } = useLiveLocation();
  const [policeStations, setPoliceStations] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [manualLocation, setManualLocation] = useState(null);
  const [daughterName, setDaughterName] = useState("");
  const [daughterLocation, setDaughterLocation] = useState(null);
  const [daughterStatus, setDaughterStatus] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const updateUserLocation = async () => {
    if (location && user.name) {
      try {
        const response = await fetch('https://backend-gut6.onrender.com/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: user.name,
            latitude: location.lat,
            longitude: location.lng,
          }),
        });
        if (!response.ok) throw new Error('Failed to update location');
      } catch (error) {
        console.error("Error updating location:", error);
      }
    }
  };

  const handleManualLocation = async () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          const newLocation = {
            lat: lat,
            lng: lng,
            accuracy: 0
          };
          setLocation(newLocation);
          setManualLocation(newLocation);
          setLocationDetails({ fullAddress: data.display_name });
          setLatInput("");
          setLngInput("");
          setStatus("Manual location set");
          await updateUserLocation();
        }
      } catch (error) {
        console.error("Invalid coordinates:", error);
        setStatus("Invalid coordinates entered");
      }
    }
  };

  const searchDaughterLocation = async () => {
    try {
      const response = await fetch(`https://backend-gut6.onrender.com/api/users/${daughterName}`);
      const data = await response.json();
      if (response.ok && data) {
        setDaughterLocation({ lat: data.latitude, lng: data.longitude });
        setDaughterStatus(`Found ${daughterName}'s location`);
      } else {
        setDaughterLocation(null);
        setDaughterStatus("Your daughter is not registered in the website");
      }
    } catch (error) {
      console.error("Error searching daughter:", error);
      setDaughterStatus("Error searching for daughter");
      setDaughterLocation(null);
    }
  };

  const calculateTravelTime = (distanceKm) => ({
    walk: (distanceKm / 5) * 60,
    bike: (distanceKm / 15) * 60,
    bus: (distanceKm / 30) * 60,
    car: (distanceKm / 40) * 60
  });

  const handleEmergency = () => {
    if (!location) {
      alert("Location not available yet...");
      return;
    }
    const nearestStation = policeStations[0];
    alert(
      `EMERGENCY ALERT!\n` +
      `Your Location: ${locationDetails.fullAddress}\n` +
      `Coordinates: ${location?.lat}, ${location?.lng}\n` +
      (nearestStation ? 
        `Nearest Police: ${nearestStation.name}\nDistance: ${(nearestStation.distance * 1000).toFixed(0)} m` : 
        "No nearby police stations found")
    );
  };

  useEffect(() => {
    if (location) updateUserLocation();
  }, [location]);

  if (showWelcome) {
    return (
      <WelcomePage 
        onEnter={() => setShowWelcome(false)} 
      />
    );
  }

  if (!location) {
    return <div>Loading location...</div>;
  }

  return (
    <div className="loc-page zoom-in-3d">
      <header className="header glass-effect">
        <div className="header-content">
          <button onClick={() => navigate("/")} className="home-button">
            Home
          </button>
          <h1><Shield size={26} /> Women's Safety Guardian</h1>
          <button onClick={refreshLocation} className="location-button">
            <RefreshCw size={20} /> Refresh
          </button>
        </div>
      </header>

      <div className="main-content">
        <section className={`map-section ${isFullScreen ? "fullscreen" : ""}`}>
          <MapComponent
            userLocation={location}
            policeStations={policeStations}
            setPoliceStations={setPoliceStations}
            manualLocation={manualLocation}
            daughterLocation={daughterLocation}
            setDaughterLocation={setDaughterLocation}
          />
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="fullscreen-toggle">
            <Map size={20} /> {isFullScreen ? "Exit" : "Fullscreen"}
          </button>
        </section>

        <div className={`info-panel ${isFullScreen ? 'hidden' : ''} glass-effect`}>
          <div className="input-container fade-in">
            <input
              type="number"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="Latitude"
              className="coord-input"
            />
            <input
              type="number"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="Longitude"
              className="coord-input"
            />
            <button onClick={handleManualLocation} className="search-button">
              <Search size={20} /> Set Location
            </button>
          </div>

          {user.role === 'parent' && (
            <div className="input-container fade-in">
              <input
                type="text"
                value={daughterName}
                onChange={(e) => setDaughterName(e.target.value)}
                placeholder="Enter your daughter's name"
                className="coord-input"
              />
              <button onClick={searchDaughterLocation} className="search-button">
                <Search size={20} /> Search Location
              </button>
              {daughterStatus && <p>{daughterStatus}</p>}
            </div>
          )}
          </div>

          <div className="info-box fade-in">
            <h3>Your Location</h3>
            <p><strong>Address:</strong> {locationDetails.fullAddress}</p>
            <p><strong>Coordinates:</strong> {location?.lat?.toFixed(6)}, {location?.lng?.toFixed(6)}</p>
            <p><strong>Status:</strong> <Info size={16} /> {status}</p>
          </div>

          {policeStations[0] && (
            <div className="info-box fade-in">
              <h3>Nearest Police Station</h3>
              <p><strong>Name:</strong> {policeStations[0].name}</p>
              <p><strong>Address:</strong> {policeStations[0].address}</p>
              <p><strong>Distance:</strong> {(policeStations[0].distance * 1000).toFixed(0)} m</p>
              <div className="travel-times">
                {Object.entries(calculateTravelTime(policeStations[0].distance)).map(([mode, time]) => (
                  <p key={mode}>
                    <strong>{mode.charAt(0).toUpperCase() + mode.slice(1)}:</strong> {time.toFixed(1)} min
                  </p>
                ))}
              </div>
            </div>
          )}

          {user.role !== 'parent' && (
            <button onClick={handleEmergency} className="emergency-button fade-in">
              <AlertCircle size={22} /> Emergency SOS
            </button>
          )}
        </div>
      </div>
  );
}

export default Loc;