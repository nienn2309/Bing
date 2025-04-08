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
  route: RouteCoordinate[];
  currentSegment: number;
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
  private static readonly AVERAGE_STRIDE_LENGTH = 0.7;

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

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
    return (bearing + 360) % 360;
  }

  public static calculatePointDistance(start: LocationState | RouteCoordinate, end: RouteCoordinate): number {
    const R = 6371e3;
    const φ1 = this.toRadians(start.latitude);
    const φ2 = this.toRadians(end.latitude);
    const Δφ = this.toRadians(end.latitude - start.latitude);
    const Δλ = this.toRadians(end.longitude - start.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private static calculatePathDistance({ location, route, currentSegment, destination, waypointNumber }: DistanceParams): number {
    let totalDistance = 0;
    
    // Calculate distance from current location to nearest point on route
    const nearestSegment = this.findNearestSegment(location, route);
    const nearestPoint = this.findNearestPointOnSegment(
      location,
      route[nearestSegment],
      route[nearestSegment + 1]
    );
    
    totalDistance += this.calculatePointDistance(location, nearestPoint);
    
    // Calculate distances between remaining waypoints until destination
    const destinationIndex = route.findIndex(point => 
      point.latitude === destination.latitude && 
      point.longitude === destination.longitude
    );

    for (let i = nearestSegment; i < destinationIndex; i++) {
      totalDistance += this.calculatePointDistance(route[i], route[i + 1]);
    }

    if (waypointNumber !== undefined) {
      console.log(`Calculated path distance to waypoint ${waypointNumber}: ${totalDistance} meters`);
    }

    return totalDistance;
  }

  private static findNearestSegment(location: LocationState, route: RouteCoordinate[]): number {
    let minDistance = Infinity;
    let nearestSegment = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      const d = this.calculateDistanceToSegment(location, start, end);
      if (d < minDistance) {
        minDistance = d;
        nearestSegment = i;
      }
    }

    return nearestSegment;
  }

  private static calculateDistanceToSegment(
    point: LocationState,
    segmentStart: RouteCoordinate,
    segmentEnd: RouteCoordinate
  ): number {
    const x = point.longitude;
    const y = point.latitude;
    const x1 = segmentStart.longitude;
    const y1 = segmentStart.latitude;
    const x2 = segmentEnd.longitude;
    const y2 = segmentEnd.latitude;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    const nearestPoint = this.findNearestPointOnSegment(point, segmentStart, segmentEnd);
    return this.calculatePointDistance(point, nearestPoint);
  }

  private static findNearestPointOnSegment(
    point: LocationState,
    segmentStart: RouteCoordinate,
    segmentEnd: RouteCoordinate
  ): RouteCoordinate {
    const x = point.longitude;
    const y = point.latitude;
    const x1 = segmentStart.longitude;
    const y1 = segmentStart.latitude;
    const x2 = segmentEnd.longitude;
    const y2 = segmentEnd.latitude;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    return { latitude: yy, longitude: xx };
  }

  public static getHeadingDifference(userHeading: number, requiredBearing: number): number {
    let diff = (requiredBearing - userHeading + 360) % 360;
    if (diff > 180) diff -= 360;
    return diff;
  }

  public static getTurnDirection(headingDiff: number): string {
    if (Math.abs(headingDiff) <= this.HEADING_TOLERANCE) {
      return "straight ahead";
    }
    return headingDiff > 0 ? "right" : "left";
  }

  private static getStepsFromDistance(distance: number): number {
    return Math.round(distance / this.AVERAGE_STRIDE_LENGTH);
  }

  private static getClockDirection(bearing: number): string {
    const clockPosition = Math.round(bearing / 30);
    return `${clockPosition === 0 ? 12 : clockPosition} o'clock`;
  }

  public static getNextInstruction({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    console.log(`Getting next instruction at segment ${currentSegment} for route length ${route.length}`);
    
    if (route.length < 2 || currentSegment >= route.length - 1) {
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
    const pathDistance = this.calculatePathDistance({ 
      location, 
      route,
      currentSegment,
      destination: nextPoint,
      waypointNumber: currentSegment + 1 
    });
    
    const requiredBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, requiredBearing);
    const isLastWaypoint = currentSegment === route.length - 2;
    const clockDirection = this.getClockDirection(requiredBearing);
    const stepsToNext = this.getStepsFromDistance(pathDistance);

    if (pathDistance < this.ARRIVAL_THRESHOLD) {
      return this.getNextTurn({ location, route, currentSegment: currentSegment + 1 });
    }

    if (currentSegment === 0) {
      const turnDirection = this.getTurnDirection(headingDiff);
      return {
        type: 'START',
        distance: pathDistance,
        message: `Turn ${turnDirection} and proceed for ${stepsToNext} steps to reach waypoint 1 of ${route.length - 1}`,
        requiredBearing,
        isLastWaypoint: false,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1,
        clockDirection,
        stepsRemaining: stepsToNext
      };
    }

    const turnDirection = this.getTurnDirection(headingDiff);
    const waypointInfo = isLastWaypoint ? 
      'last waypoint before final destination' : 
      `waypoint ${currentSegment + 1} of ${route.length - 1}`;

    if (turnDirection !== "straight ahead") {
      return {
        type: Math.abs(headingDiff) > 90 ? 'TURN_RIGHT' : 'STRAIGHT',
        distance: pathDistance,
        message: `Adjust your direction ${turnDirection} and continue for ${stepsToNext} steps to reach ${waypointInfo}`,
        requiredBearing,
        isLastWaypoint,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1,
        clockDirection,
        stepsRemaining: stepsToNext
      };
    }

    return {
      type: 'STRAIGHT',
      distance: pathDistance,
      message: `Continue straight for ${stepsToNext} steps to reach ${waypointInfo}`,
      requiredBearing,
      isLastWaypoint,
      waypointNumber: currentSegment + 1,
      totalWaypoints: route.length - 1,
      clockDirection,
      stepsRemaining: stepsToNext
    };
  }

  private static getNextTurn({ location, route, currentSegment }: NavigationParams): NavigationInstruction {
    if (currentSegment >= route.length - 2) {
      const finalPoint = route[route.length - 1];
      const pathDistance = this.calculatePathDistance({ 
        location, 
        route,
        currentSegment,
        destination: finalPoint,
        waypointNumber: route.length 
      });
      
      const finalBearing = this.calculateBearing(location, finalPoint);
      const headingDiff = this.getHeadingDifference(location.heading, finalBearing);
      const turnDirection = this.getTurnDirection(headingDiff);
      const stepsToEnd = this.getStepsFromDistance(pathDistance);
      const clockDirection = this.getClockDirection(finalBearing);
      
      return {
        type: 'DESTINATION',
        distance: pathDistance,
        message: turnDirection === "straight ahead" 
          ? `Your final destination is straight ahead, approximately ${stepsToEnd} steps`
          : `Turn ${turnDirection} to reach your final destination in approximately ${stepsToEnd} steps`,
        requiredBearing: finalBearing,
        isLastWaypoint: true,
        waypointNumber: route.length,
        totalWaypoints: route.length,
        clockDirection,
        stepsRemaining: stepsToEnd
      };
    }

    const nextPoint = route[currentSegment + 1];
    const pathDistance = this.calculatePathDistance({ 
      location, 
      route,
      currentSegment,
      destination: nextPoint,
      waypointNumber: currentSegment + 1 
    });
    
    const nextBearing = this.calculateBearing(location, nextPoint);
    const headingDiff = this.getHeadingDifference(location.heading, nextBearing);
    const turnDirection = this.getTurnDirection(headingDiff);
    const isLastWaypoint = currentSegment === route.length - 2;
    const stepsToNext = this.getStepsFromDistance(pathDistance);
    const clockDirection = this.getClockDirection(nextBearing);

    const waypointInfo = isLastWaypoint ? 
      'final waypoint' : 
      `waypoint ${currentSegment + 1} of ${route.length - 1}`;

    if (Math.abs(headingDiff) > this.DIRECTION_THRESHOLD) {
      return {
        type: headingDiff > 0 ? 'TURN_RIGHT' : 'TURN_LEFT',
        distance: pathDistance,
        message: `Turn ${turnDirection} in approximately ${stepsToNext} steps to reach ${waypointInfo}`,
        requiredBearing: nextBearing,
        isLastWaypoint,
        waypointNumber: currentSegment + 1,
        totalWaypoints: route.length - 1,
        clockDirection,
        stepsRemaining: stepsToNext
      };
    }

    return {
      type: 'WAYPOINT',
      distance: pathDistance,
      message: `Continue straight for approximately ${stepsToNext} steps to reach ${waypointInfo}`,
      requiredBearing: nextBearing,
      isLastWaypoint,
      waypointNumber: currentSegment + 1,
      totalWaypoints: route.length - 1,
      clockDirection,
      stepsRemaining: stepsToNext
    };
  }

  public static getUserProgress({ location, route }: ProgressParams): number {
    const nearestSegment = this.findNearestSegment(location, route);
    
    const isLastWaypoint = nearestSegment === route.length - 2;
    const progressMessage = isLastWaypoint ? 
      'User is at the last waypoint before final destination' : 
      `User is at waypoint ${nearestSegment + 1} of ${route.length - 1}`;
    
    console.log(progressMessage);
    return nearestSegment;
  }
}