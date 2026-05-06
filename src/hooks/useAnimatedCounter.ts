import { useEffect, useRef, useState } from 'react';

/** Cubic ease-in: starts slow, accelerates toward the final value (ramp-up feel). */
function easeIn(t: number): number {
  return t * t * t;
}

/** Cubic ease-out: starts fast, decelerates to a stop (penalty-drop feel). */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a numeric value from its previous state to a new target.
 *
 * - Increases use ease-in so the counter accelerates (ramp-up).
 * - Decreases use ease-out for a quick penalty-drop feel.
 * - Duration scales with the size of the change, capped at 900 ms.
 */
export function useAnimatedCounter(target: number): number {
  const [displayed, setDisplayed] = useState(target);
  const frameRef = useRef<number | null>(null);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    const from = prevTargetRef.current;
    const to = target;
    prevTargetRef.current = to;

    if (from === to) return;

    // Cancel any in-flight animation before starting a new one.
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const delta = Math.abs(to - from);
    const isIncrease = to > from;

    // 300 ms base + 40 ms per point, capped at 900 ms.
    const duration = Math.min(300 + delta * 40, 900);

    const easeFn = isIncrease ? easeIn : easeOut;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeFn(t);
      const current = Math.round(from + (to - from) * eased);
      setDisplayed(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target]);

  return displayed;
}
