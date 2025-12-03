'use client';

import { useState, useEffect } from 'react';

interface SunPosition {
  sunAngle: number; // Horizontal angle (0 = east, PI = west)
  sunHeight: number; // Vertical position (-1 to 1, negative = below horizon)
  timeOfDay: 'night' | 'dawn' | 'day' | 'dusk';
  hour: number;
}

export function useSunPosition(): SunPosition {
  const [sunPosition, setSunPosition] = useState<SunPosition>(() => calculateSunPosition());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setSunPosition(calculateSunPosition());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return sunPosition;
}

function calculateSunPosition(): SunPosition {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  // Calculate sun angle (position along the arc)
  // 6am (hour 6) = sunrise (east) = angle 0
  // 12pm (hour 12) = zenith = angle PI/2
  // 6pm (hour 18) = sunset (west) = angle PI
  // Night hours: sun is below horizon

  let sunAngle: number;
  let sunHeight: number;
  let timeOfDay: 'night' | 'dawn' | 'day' | 'dusk';

  if (hour >= 6 && hour <= 18) {
    // Daytime: sun travels from east to west
    sunAngle = ((hour - 6) / 12) * Math.PI;
    sunHeight = Math.sin(sunAngle); // 0 at sunrise/sunset, 1 at noon
  } else if (hour > 18) {
    // Evening to midnight
    sunAngle = Math.PI; // Sun set in the west
    sunHeight = -Math.sin(((hour - 18) / 12) * Math.PI); // Goes negative
  } else {
    // Midnight to morning
    sunAngle = 0; // Sun will rise in the east
    sunHeight = -Math.sin(((6 - hour) / 12) * Math.PI); // Still negative
  }

  // Determine time of day
  if (hour >= 5 && hour < 7) {
    timeOfDay = 'dawn';
  } else if (hour >= 7 && hour < 17) {
    timeOfDay = 'day';
  } else if (hour >= 17 && hour < 19) {
    timeOfDay = 'dusk';
  } else {
    timeOfDay = 'night';
  }

  return {
    sunAngle,
    sunHeight,
    timeOfDay,
    hour,
  };
}
