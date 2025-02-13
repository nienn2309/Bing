import { LocationState, RouteCoordinate } from '../Type';

export interface NavigationInstruction {
  type: 'STRAIGHT' | 'TURN_LEFT' | 'TURN_RIGHT' | 'DESTINATION' | 'START' | 'WAYPOINT';
  distance: number;
  message: string;
  requiredBearing?: number;
  isLastWaypoint?: boolean;
  waypointNumber?: number;
  totalWaypoints?: number;
  clockDirection?: string;
  stepsRemaining?: number;
}

interface NavigationParams {
  location: LocationState;
  route: RouteCoordinate[];
  currentSegment: number;
}

interface DistanceParams {
  location: LocationState;
  destination: RouteCoordinate;
  waypointNumber?: number;
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
  private static readonly COUNTDOWN_THRESHOLD = 20;
  private static readonly AVERAGE_STRIDE_LENGTH = 0.7; // Average stride length in meters

  // Converts degrees to radians
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Converts radians to degrees
  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  // Calculates bearing between two points
  private static calculateBearing(start: LocationState | RouteCoordinate, end: RouteCoordinate): number {
    const startLat = this.toRadians(start.latitude);
    const startLng = this.toRadians(start.longitude);
    const endLat = this.toRadians(end.latitude);
    const endLng = this.toRadians(end.longitude);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    
    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);

    const normalized = (bearing + 360) % 360;

    console.log(`Calculated bearing from [${start.latitude}, ${start.longitude}] to [${end.latitude}, ${end.longitude}] is ${normalized}`);
    return normalized;
  }

  public static calculateDistance({ location, destination, waypointNumber }: DistanceParams): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(location.latitude);
    const φ2 = this.toRadians(destination.latitude);
    const Δφ = this.toRadians(destination.latitude - location.latitude);
    const Δλ = this.toRadians(destination.longitude - location.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Log the waypoint number if provided
    if (waypointNumber !== undefined) {
      console.log(`Calculated distance to waypoint ${waypointNumber}: ${distance} meters`);
    } else {
      console.log(`Calculated distance: ${distance} meters`);
    }

    return distance;
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

  private static getStepsFromDistance(distance: number): number {
    return Math.round(distance / this.AVERAGE_STRIDE_LENGTH);
  }

  public static getNextInstruction({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    console.log(`Getting next instruction at segment ${currentSegment} for route length ${route.length}`);
    
    if (route.length < 2 || currentSegment >= route.length - 1) {
      console.log('Route is empty or user has reached destination');
      return {
        type: 'DESTINATION',
        distance: 0,
        message: 'You have reached your final destination',
        isLastWaypoint: false,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length
      };
    }

    const nextPoint = route[currentSegment + 1];
    const distanceToNext = this.calculateDistance({ 
      location, 
      destination: nextPoint, 
      waypointNumber: currentSegment + 1 
    });
    const requiredBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, requiredBearing);
    const isLastWaypoint = currentSegment === route.length - 2;
    const clockDirection = this.getClockDirection(requiredBearing);
    const stepsToNext = this.getStepsFromDistance(distanceToNext);

    console.log(`Next waypoint: [${nextPoint.latitude}, ${nextPoint.longitude}], Distance to next: ${distanceToNext}, Required bearing: ${requiredBearing}, Heading difference: ${headingDiff}`);

    if (distanceToNext < this.ARRIVAL_THRESHOLD) {
      return this.getNextTurn({ location, route, currentSegment: currentSegment + 1 });
    }

    if (currentSegment === 0) {
      const turnDirection = this.getTurnDirection(headingDiff);
      console.log(`Starting navigation, turn ${turnDirection} and proceed for ${distanceToNext} meters`);
      return {
        type: 'START',
        distance: distanceToNext,
        message: `Turn ${turnDirection} and proceed for ${stepsToNext} steps to reach waypoint 1 of ${route.length - 1}`,
        requiredBearing,
        isLastWaypoint: false,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1
      };
    }

    if (distanceToNext < this.TURN_THRESHOLD) {
      console.log('Reached turn threshold, getting next turn');
      return this.getNextTurn({ location, route, currentSegment });
    }

    const turnDirection = this.getTurnDirection(headingDiff);
    console.log(`Instruction based on headingDiff: ${headingDiff} (${turnDirection})`);
    
    const waypointInfo = isLastWaypoint ? 
      'last waypoint before final destination' : 
      `waypoint ${currentSegment + 1} of ${route.length - 1}`;

    if (turnDirection !== "straight ahead") {
      return {
        type: Math.abs(headingDiff) > 90 ? 'TURN_RIGHT' : 'STRAIGHT',
        distance: distanceToNext,
        message: `Adjust your direction ${turnDirection} and continue for ${stepsToNext} steps to reach ${waypointInfo}`,
        requiredBearing,
        isLastWaypoint,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1
      };
    }

    return {
      type: 'STRAIGHT',
      distance: distanceToNext,
      message: `Continue straight for ${stepsToNext} steps to reach ${waypointInfo}`,
      requiredBearing,
      isLastWaypoint,
      waypointNumber: currentSegment + 1,
      totalWaypoints: route.length - 1
    };
  }

  private static getNextTurn({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    console.log(`Getting next turn from segment ${currentSegment}`);
    if (currentSegment >= route.length - 2) {
      const finalPoint = route[route.length - 1];
      const distanceToEnd = this.calculateDistance({ 
        location, 
        destination: finalPoint, 
        waypointNumber: route.length 
      });
      const finalBearing = this.calculateBearing(location, finalPoint);
      const headingDiff = this.getHeadingDifference(location.heading, finalBearing);
      const turnDirection = this.getTurnDirection(headingDiff);
      const stepsToEnd = this.getStepsFromDistance(distanceToEnd);
      
      return {
        type: 'DESTINATION',
        distance: distanceToEnd,
        message: turnDirection === "straight ahead" 
          ? `Your final destination is straight ahead, approximately ${stepsToEnd} steps`
          : `Turn ${turnDirection} to reach your final destination in approximately ${stepsToEnd} steps`,
        requiredBearing: finalBearing,
        isLastWaypoint: false,
        waypointNumber: route.length,
        totalWaypoints: route.length
      };
    }

    const nextPoint = route[currentSegment + 1];
    const nextBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, nextBearing);
    const turnDirection = this.getTurnDirection(headingDiff);
    const distance = this.calculateDistance({ 
      location, 
      destination: nextPoint, 
      waypointNumber: currentSegment + 1 
    });
    const isLastWaypoint = currentSegment === route.length - 2;
    const stepsToNext = this.getStepsFromDistance(distance);

    const waypointInfo = isLastWaypoint ? 
      'final waypoint' : 
      `waypoint ${currentSegment + 1} of ${route.length - 1}`;

    if (Math.abs(headingDiff) > this.DIRECTION_THRESHOLD) {
      return {
        type: headingDiff > 0 ? 'TURN_RIGHT' : 'TURN_LEFT',
        distance,
        message: `Turn ${turnDirection} in approximately ${stepsToNext} steps to reach ${waypointInfo}`,
        requiredBearing: nextBearing,
        isLastWaypoint,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1
      };
    }

    return {
      type: 'WAYPOINT',
      distance,
      message: `Continue straight for approximately ${stepsToNext} steps to reach ${waypointInfo}`,
      requiredBearing: nextBearing,
      isLastWaypoint,
      waypointNumber: currentSegment + 1,
      totalWaypoints: route.length - 1
    };
  }

  // Convert bearing to clock position (1-12)
  private static getClockDirection(bearing: number): string {
    const clockPosition = Math.round(bearing / 30);
    return `${clockPosition === 0 ? 12 : clockPosition} o'clock`;
  }

  // Enhanced step calculation with stride length guidance
  private static getStepInstruction(meters: number): string {
    const steps = this.getStepsFromDistance(meters);
    return `approximately ${steps} steps ahead`;
  }

  // Get countdown message based on remaining distance
  private static getCountdownMessage(meters: number): string {
    const steps = this.getStepsFromDistance(meters);
    
    if (meters <= 2) {
      return "Stop now. You have reached your destination.";
    } else if (meters <= 5) {
      return `Keep walking slowly, your destination is ${steps} steps ahead`;
    } else if (meters <= 10) {
      return `Getting very close, about ${steps} steps remaining. Start walking more carefully`;
    } else if (meters <= 15) {
      return `Approaching destination, about ${steps} steps ahead. Prepare to slow down`;
    }
    
    return `Continue walking, about ${steps} steps remaining to destination`;
  }

  public static getUserProgress({ location, route }: ProgressParams): number {
    let minDistance = Infinity;
    let closestIndex = 0;

    route.forEach((point, index) => {
      const d = this.calculateDistance({ location, destination: point });
      if (d < minDistance) {
        minDistance = d;
        closestIndex = index;
      }
    });
    
    const isLastWaypoint = closestIndex === route.length - 2;
    const progressMessage = isLastWaypoint ? 
      'User is at the last waypoint before final destination' : 
      `User is at waypoint ${closestIndex + 1} of ${route.length - 1}`;
    
    console.log(`User progress: ${progressMessage} at a distance of ${minDistance} meters`);
    return closestIndex;
  }
}