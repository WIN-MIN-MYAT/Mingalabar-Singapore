// customMapStyle arrays for react-native-maps. Pass `mapStyles[isDark ? 'dark' : 'light']`
// to <MapView customMapStyle={...} />. Light is the default (empty) style.
export const mapStyles = {
  light: [],
  dark: [
    { elementType: 'geometry', color: '#1b1e24' },
    { elementType: 'labels.text.stroke', color: '#1b1e24' },
    { elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', color: '#c2c6ce' },
    { featureType: 'poi', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'poi.park', elementType: 'geometry', color: '#242831' },
    { featureType: 'road', elementType: 'geometry', color: '#2a2f38' },
    { featureType: 'road', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'road.highway', elementType: 'geometry', color: '#3a3f4a' },
    { featureType: 'transit', elementType: 'geometry', color: '#2a2f38' },
    { featureType: 'transit.station', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'water', elementType: 'geometry', color: '#0f1115' },
    { featureType: 'water', elementType: 'labels.text.fill', color: '#8b909a' },
  ],
};
