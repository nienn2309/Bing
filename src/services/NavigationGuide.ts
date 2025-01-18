import { LocationState, RouteCoordinate } from '../Type';

export interface NavigationInstruction {
  type: 'STRAIGHT' | 'TURN_LEFT' | 'TURN_RIGHT' | 'DESTINATION' | 'START';
  distance: number;
  message: string;
  requiredBearing?: number;
}

interface NavigationParams {
  location: LocationState;
  route: RouteCoordinate[];
  currentSegment: number;
}

interface DistanceParams {
  location: LocationState;
  destination: RouteCoordinate;
}

interface ProgressParams {
  location: LocationState;
  route: RouteCoordinate[];
}

export class NavigationGuide {
  private static readonly DIRECTION_THRESHOLD = 30;
  private static readonly TURN_THRESHOLD = 15;
  private static readonly ARRIVAL_THRESHOLD = 10;
  private static readonly HEADING_TOLERANCE = 20;

  // This method calculates the bearing (direction) between two geographical points
  private static calculateBearing(start: LocationState | RouteCoordinate, end: RouteCoordinate): number {
    const startLat = this.toRadians(start.latitude); // Convert start latitude to radians
    const startLng = this.toRadians(start.longitude); // Convert start longitude to radians
    const endLat = this.toRadians(end.latitude); // Convert end latitude to radians
    const endLng = this.toRadians(end.longitude); // Convert end longitude to radians

    // Calculate the differences in coordinates
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    
    // Calculate the bearing using the arctangent of y and x
    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing); // Convert the bearing from radians to degrees
    return (bearing + 360) % 360; // Normalize the bearing to a value between 0 and 360 degrees
  }

  // This method calculates the relative turn direction based on the current heading and target heading
  public static getRelativeTurnDirection(currentHeading: number, targetHeading: number): string {
    // Calculate the difference between the target heading and the current heading
    let diff = (targetHeading - currentHeading + 360) % 360;
    if (diff > 180) diff -= 360; // Normalize the difference to the range -180 to 180

    const absChange = Math.abs(diff); // Get the absolute value of the difference
    if (absChange <= 20) {
      return "straight ahead"; // If the change is small, continue straight ahead
    } else if (absChange <= 45) {
      return diff > 0 ? "slightly right" : "slightly left"; // If the change is moderate, turn slightly
    } else if (absChange <= 90) {
      return diff > 0 ? "right" : "left"; // If the change is significant, turn right or left
    } else {
      return diff > 0 ? "sharp right" : "sharp left"; // If the change is large, make a sharp turn
    }
  }

  // This method calculates the distance between two geographical points using the Haversine formula
  public static calculateDistance({ location, destination }: DistanceParams): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(location.latitude); // Convert latitude of the location to radians
    const φ2 = this.toRadians(destination.latitude); // Convert latitude of the destination to radians
    const Δφ = this.toRadians(destination.latitude - location.latitude); // Calculate the difference in latitude
    const Δλ = this.toRadians(destination.longitude - location.longitude); // Calculate the difference in longitude

    // Apply the Haversine formula
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Return the distance in meters
  }

  // Converts degrees to radians
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Converts radians to degrees
  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private static getHeadingDifference(userHeading: number, requiredBearing: number): number {
    let diff = (requiredBearing - userHeading + 360) % 360;
    if (diff > 180) diff -= 360;
    return diff;
  }

  private static getTurnDirection(headingDiff: number): string {
    if (Math.abs(headingDiff) <= this.HEADING_TOLERANCE) {
      return "straight ahead";
    }
    return headingDiff > 0 ? "right" : "left";
  }
  
  // This method calculates the next navigation instruction based on the current location and route
  public static getNextInstruction({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    if (route.length < 2 || currentSegment >= route.length - 1) {
      return {
        type: 'DESTINATION',
        distance: 0,
        message: 'You have reached your destination'
      };
    }

    const nextPoint = route[currentSegment + 1];
    const distanceToNext = this.calculateDistance({ location, destination: nextPoint });
    const requiredBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, requiredBearing);

    if (distanceToNext < this.ARRIVAL_THRESHOLD) {
      return this.getNextTurn({ location, route, currentSegment: currentSegment + 1 });
    }

    if (currentSegment === 0) {
      const turnDirection = this.getTurnDirection(headingDiff);
      return {
        type: 'START',
        distance: distanceToNext,
        message: `Turn ${turnDirection} and proceed for ${Math.round(distanceToNext)} meters`,
        requiredBearing
      };
    }

    if (distanceToNext < this.TURN_THRESHOLD) {
      return this.getNextTurn({ location, route, currentSegment });
    }

    const turnDirection = this.getTurnDirection(headingDiff);
    if (turnDirection !== "straight ahead") {
      return {
        type: Math.abs(headingDiff) > 90 ? 'TURN_RIGHT' : 'STRAIGHT',
        distance: distanceToNext,
        message: `Adjust your direction ${turnDirection} and continue for ${Math.round(distanceToNext)} meters`,
        requiredBearing
      };
    }

    return {
      type: 'STRAIGHT',
      distance: distanceToNext,
      message: `Continue straight for ${Math.round(distanceToNext)} meters`,
      requiredBearing
    };
  }

  private static getNextTurn({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    if (currentSegment >= route.length - 2) {
      const finalPoint = route[route.length - 1];
      const distanceToEnd = this.calculateDistance({ location, destination: finalPoint });
      const finalBearing = this.calculateBearing(location, finalPoint);
      const headingDiff = this.getHeadingDifference(location.heading, finalBearing);
      const turnDirection = this.getTurnDirection(headingDiff);
      
      return {
        type: 'DESTINATION',
        distance: distanceToEnd,
        message: turnDirection === "straight ahead" 
          ? 'Your destination is straight ahead'
          : `Turn ${turnDirection} to reach your destination`,
        requiredBearing: finalBearing
      };
    }

    const nextPoint = route[currentSegment + 1];
    const nextBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, nextBearing);
    const turnDirection = this.getTurnDirection(headingDiff);
    const distance = this.calculateDistance({ location, destination: nextPoint });

    if (Math.abs(headingDiff) > this.DIRECTION_THRESHOLD) {
      return {
        type: headingDiff > 0 ? 'TURN_RIGHT' : 'TURN_LEFT',
        distance,
        message: `Turn ${turnDirection} in ${Math.round(distance)} meters`,
        requiredBearing: nextBearing
      };
    }

    return {
      type: 'STRAIGHT',
      distance,
      message: `Continue straight for ${Math.round(distance)} meters`,
      requiredBearing: nextBearing
    };
  }

  public static getUserProgress({ location, route }: ProgressParams): number {
    let minDistance = Infinity;
    let closestIndex = 0;

    route.forEach((point, index) => {
      const distance = this.calculateDistance({ location, destination: point });
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }
}