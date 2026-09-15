import { useEffect, useState } from 'react';

const DEMO_TIME_STEPS = [
  '2025-01-01',
  '2025-01-02',
  '2025-01-03',
  '2025-01-04',
  '2025-01-05',
  '2025-01-06',
  '2025-01-07',
];

export function useTimeStepAnimation(availableTimes?: string[]) {
  const timeSteps = availableTimes && availableTimes.length > 0 ? availableTimes : DEMO_TIME_STEPS;

  const [timeStep, setTimeStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);

  useEffect(() => {
    if (!isPlaying) return;

    const id = window.setInterval(() => {
      setTimeStep((current) => (current + 1) % timeSteps.length);
    }, speedMs);

    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, timeSteps.length]);

  const currentDate = timeSteps[timeStep % timeSteps.length] || '2025-01-01';

  return {
    timeStep,
    setTimeStep,
    isPlaying,
    setIsPlaying,
    speedMs,
    setSpeedMs,
    timeSteps,
    currentDate,
  };
}
