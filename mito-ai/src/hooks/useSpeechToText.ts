/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string };
        };
    };
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
    const win = window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function useSpeechToText(onTranscript: (text: string) => void): {
    isListening: boolean;
    isSupported: boolean;
    toggleListening: () => void;
} {
    const [isListening, setIsListening] = useState(false);
    const [isSupported] = useState(() => getSpeechRecognitionConstructor() !== null);
    const recognitionRef = useRef<ISpeechRecognition | null>(null);
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;

    const releaseRecognition = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            return;
        }
        recognitionRef.current = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
    }, []);

    const stopListening = useCallback(() => {
        releaseRecognition();
        setIsListening(false);
    }, [releaseRecognition]);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            return;
        }

        const SpeechRecognitionClass = getSpeechRecognitionConstructor();
        if (!SpeechRecognitionClass) {
            return;
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
            if (recognitionRef.current !== recognition) {
                return;
            }
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const alternative = result?.[0];
                if (!result?.isFinal || !alternative) {
                    continue;
                }
                transcript += alternative.transcript;
            }
            const trimmed = transcript.trim();
            if (trimmed) {
                onTranscriptRef.current(trimmed);
            }
        };

        recognition.onerror = () => {
            if (recognitionRef.current !== recognition) {
                return;
            }
            stopListening();
        };

        recognition.onend = () => {
            if (recognitionRef.current !== recognition) {
                return;
            }
            recognitionRef.current = null;
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [stopListening]);

    const toggleListening = useCallback(() => {
        if (recognitionRef.current) {
            stopListening();
        } else {
            startListening();
        }
    }, [startListening, stopListening]);

    useEffect(() => {
        return () => {
            releaseRecognition();
        };
    }, [releaseRecognition]);

    return { isListening, isSupported, toggleListening };
}
