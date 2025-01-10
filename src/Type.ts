export interface POI {
    coordinates_lat: string;
    coordinates_lon: string;
    description: string;
    floor_name: string;
    floor_number: string;
    image: string;
    is_building_entrance: string;
    is_door: string;
    is_published: string;
    name: string;
    pois_type: string;
    puid: string;
  }
  
  export interface LocationState {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
    heading: number;
  }
  
  export interface RouteCoordinate {
    latitude: number;
    longitude: number;
  }