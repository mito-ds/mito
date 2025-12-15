/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Plays a completion sound to notify the user that the agent has finished.
 * Uses the Web Audio API to generate a pleasant two-tone notification sound.
 */
export const playCompletionSound = (audioContext: AudioContext | null): void => {

    if (!audioContext) {
        return;
    }

    // Create a pleasant two-note completion sound
    const playTone = (frequency: number, startTime: number, duration: number): void => {
        const oscillator = audioContext!.createOscillator();
        const gainNode = audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext!.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Fade in and out for a smoother sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;

    // Play two ascending tones (C5 and E5) for a pleasant "complete" sound
    playTone(523.25, now, 0.15);        // C5
    playTone(659.25, now + 0.12, 0.2);  // E5
};
