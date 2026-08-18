import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, Conversation, GeminiSettings } from '@/types';
import { streamGemini, generateTitle, GeminiError } from '@/lib/gemini';
import {
  TextToSpeech,
  SpeechToText,
  isSTTAvailable,
  isTTSAvailable,
  VOICE_SYSTEM_PROMPT_ADDITION,
} from '@/lib/voice';
import type { VoiceState } from '@/components/VoiceBar';

interface UseVoiceModeOptions {
  hasKey: boolean;
  activeId: string | null;
  settings: GeminiSettings;
  conversations: Conversation[];
  createConversation: () => string;
  updateConversation: (id: string, updater: (c: Conversation) => Conversation) => void;
  renameConversation: (id: string, newTitle: string) => void;
  onRequireKey: () => void;
}

export function useVoiceMode({
  hasKey,
  activeId,
  settings,
  conversations,
  createConversation,
  updateConversation,
  renameConversation,
  onRequireKey,
}: UseVoiceModeOptions) {
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceLastUser, setVoiceLastUser] = useState('');
  const [voiceLastModel, setVoiceLastModel] = useState('');

  const ttsRef = useRef<TextToSpeech | null>(null);
  const sttRef = useRef<SpeechToText | null>(null);
  const voiceAbortRef = useRef<AbortController | null>(null);
  const autoListenRef = useRef(false);
  const voiceModeRef = useRef(false);

  const voiceSendRef = useRef<(text: string) => Promise<void>>();
  const startListeningRef = useRef<() => void>();

  useEffect(() => {
    if (isTTSAvailable()) {
      ttsRef.current = new TextToSpeech();
    }
    if (isSTTAvailable()) {
      sttRef.current = new SpeechToText();
    }
    return () => {
      ttsRef.current?.cancel();
      sttRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    sttRef.current?.stop();
    setInterimTranscript('');
  }, []);

  const stopSpeaking = useCallback(() => {
    ttsRef.current?.cancel();
  }, []);

  const startListening = useCallback(() => {
    if (!sttRef.current?.available) {
      setVoiceError('Speech recognition is not available in this browser. Try Chrome or Edge.');
      return;
    }
    if (!voiceModeRef.current) return;

    setVoiceError(null);
    setInterimTranscript('');
    setVoiceState('listening');

    sttRef.current.onResult = (transcript, isFinal) => {
      if (isFinal) {
        setInterimTranscript('');
        setVoiceLastUser(transcript);
        setVoiceState('thinking');
        voiceSendRef.current?.(transcript);
      } else {
        setInterimTranscript(transcript);
      }
    };
    sttRef.current.onEnd = () => {
      if (voiceModeRef.current && voiceState === 'listening') {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      }
    };
    sttRef.current.onError = (error) => {
      if (error === 'no-speech' || error === 'aborted') return;
      if (error === 'not-allowed') {
        setVoiceError('Microphone access denied. Allow microphone permissions to use voice mode.');
      } else {
        setVoiceError(`Speech recognition error: ${error}`);
      }
      setVoiceState('idle');
    };

    sttRef.current.start();
  }, [voiceState]);
  startListeningRef.current = startListening;

  const voiceSend = useCallback(
    async (text: string) => {
      if (!hasKey) {
        onRequireKey();
        return;
      }

      let convId = activeId;
      let isNewConversation = false;

      if (!convId) {
        convId = createConversation();
        isNewConversation = true;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      };

      const baseMessages = isNewConversation
        ? [userMsg]
        : [...(conversations.find((c) => c.id === convId)?.messages ?? []), userMsg];

      updateConversation(convId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg],
        title: c.title === 'New chat' ? text.slice(0, 50) : c.title,
        updatedAt: Date.now(),
      }));

      const controller = new AbortController();
      voiceAbortRef.current = controller;

      let accumulated = '';

      const voiceSettings = {
        ...settings,
        systemPrompt: settings.systemPrompt
          ? `${settings.systemPrompt}\n\n${VOICE_SYSTEM_PROMPT_ADDITION}`
          : VOICE_SYSTEM_PROMPT_ADDITION,
      };

      try {
        await streamGemini(voiceSettings, baseMessages, {
          signal: controller.signal,
          onChunk: (chunk) => {
            accumulated += chunk;
            setVoiceLastModel(accumulated);
          },
        });

        const modelMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'model',
          content: accumulated,
          createdAt: Date.now(),
        };

        updateConversation(convId, (c) => ({
          ...c,
          messages: [...c.messages, modelMsg],
          updatedAt: Date.now(),
        }));

        if (isNewConversation && accumulated) {
          generateTitle(settings, text, accumulated).then((title) => {
            if (title) renameConversation(convId!, title);
          });
        }

        if (accumulated && !voiceMuted && voiceModeRef.current) {
          setVoiceState('speaking');
          ttsRef.current!.onEnd = () => {
            if (!voiceModeRef.current) return;
            if (autoListenRef.current) {
              setTimeout(() => startListeningRef.current?.(), 300);
            } else {
              setVoiceState('idle');
            }
          };
          ttsRef.current!.speak(accumulated);
        } else {
          setVoiceState('idle');
        }
      } catch (err) {
        if (controller.signal.aborted) {
          if (accumulated) {
            const partialMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'model',
              content: accumulated,
              createdAt: Date.now(),
            };
            updateConversation(convId, (c) => ({
              ...c,
              messages: [...c.messages, partialMsg],
              updatedAt: Date.now(),
            }));
          }
          setVoiceState('idle');
        } else {
          const errMsg = err instanceof GeminiError ? err.message : 'Something went wrong.';
          setVoiceError(errMsg);
          setVoiceState('idle');
        }
      } finally {
        voiceAbortRef.current = null;
      }
    },
    [
      hasKey,
      onRequireKey,
      activeId,
      createConversation,
      conversations,
      updateConversation,
      settings,
      renameConversation,
      voiceMuted,
    ],
  );
  voiceSendRef.current = voiceSend;

  const handleVoiceToggle = useCallback(() => {
    if (!hasKey) {
      onRequireKey();
      return;
    }

    if (!ttsRef.current?.available && !sttRef.current?.available) {
      setVoiceError('Voice features are not available in this browser. Try Chrome or Edge.');
      return;
    }

    setVoiceMode((prev) => {
      const next = !prev;
      voiceModeRef.current = next;
      if (next) {
        autoListenRef.current = true;
        setVoiceError(null);
        setVoiceLastUser('');
        setVoiceLastModel('');
        setVoiceState('idle');
      } else {
        stopListening();
        stopSpeaking();
        setVoiceState('idle');
        setInterimTranscript('');
        autoListenRef.current = false;
      }
      return next;
    });
  }, [hasKey, onRequireKey, stopListening, stopSpeaking]);

  const handleVoiceTalk = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
      setVoiceState('idle');
    } else if (voiceState === 'speaking') {
      stopSpeaking();
      setVoiceState('idle');
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening, stopSpeaking]);

  const handleVoiceClose = useCallback(() => {
    voiceModeRef.current = false;
    setVoiceMode(false);
    stopListening();
    stopSpeaking();
    setVoiceState('idle');
    setInterimTranscript('');
    setVoiceLastUser('');
    setVoiceLastModel('');
    autoListenRef.current = false;
  }, [stopListening, stopSpeaking]);

  const handleVoiceMute = useCallback(() => {
    setVoiceMuted((prev) => {
      if (!prev) {
        stopSpeaking();
        if (voiceState === 'speaking') setVoiceState('idle');
      }
      return !prev;
    });
  }, [stopSpeaking, voiceState]);

  const handleStopVoice = useCallback(() => {
    voiceAbortRef.current?.abort();
    stopSpeaking();
    stopListening();
    setVoiceState('idle');
  }, [stopSpeaking, stopListening]);

  return {
    voiceMode,
    voiceState,
    interimTranscript,
    voiceError,
    voiceMuted,
    voiceLastUser,
    voiceLastModel,
    handleVoiceToggle,
    handleVoiceTalk,
    handleVoiceClose,
    handleVoiceMute,
    handleStopVoice,
  };
}
