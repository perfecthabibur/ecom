import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { geminiService } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Utility functions for audio encoding/decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Added encode function as per coding guidelines
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    // Use the custom encode function for data
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live API related refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // Chat is opening, maybe initialize something or fetch welcome message
      if (messages.length === 0) {
        setMessages([{ role: 'model', text: 'Hello! How can I assist you with your shopping today?' }]);
      }
    } else {
      // Chat is closing, clean up any active audio sessions
      stopListening();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = updatedHistory.map(msg => ({ role: msg.role, parts: [msg.text] }));
      const response = await geminiService.chatWithGemini(userMessage.text, chatHistory);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble understanding right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Live API integration for voice chat ---
  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      setMessages(prev => [...prev, { role: 'model', text: 'Listening...' }]);

      // Use standard AudioContext
      inputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
      audioSourcesRef.current.clear(); // Clear any previous audio sources

      // Get API key from window object
      const apiKey = window.GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', text: 'GEMINI_API_KEY is not set. Cannot use voice chat.' }]);
        setIsListening(false);
        return;
      }
      aiRef.current = new GoogleGenAI({ apiKey: apiKey });


      sessionPromiseRef.current = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            mediaStreamSourceRef.current = inputAudioContextRef.current?.createMediaStreamSource(stream) || null;
            scriptProcessorRef.current = inputAudioContextRef.current?.createScriptProcessor(4096, 1, 1) || null;

            if (mediaStreamSourceRef.current && scriptProcessorRef.current) {
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Received live message:', message);
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'model' && lastMsg.text.startsWith('Listening...')) {
                  return [...prev.slice(0, -1), { role: 'model', text: text }];
                }
                // If the last message is already a model response, append to it for streaming effect
                if (lastMsg && lastMsg.role === 'model' && !lastMsg.text.endsWith('...')) {
                  return [...prev.slice(0, -1), { role: 'model', text: lastMsg.text + text }];
                }
                return [...prev, { role: 'model', text: text }];
              });
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'user' && !message.serverContent?.turnComplete) { // Update last user message
                  return [...prev.slice(0, -1), { role: 'user', text: lastMsg.text + text }];
                } else if (!lastMsg || lastMsg.role === 'model') { // New user message
                    return [...prev, { role: 'user', text: text }];
                }
                return prev;
              });
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              try {
                const audioBuffer = await decodeAudioData(
                  decode(base64EncodedAudioString),
                  outputAudioContextRef.current,
                  24000,
                  1,
                );
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                outputAudioContextRef.current.resume(); // Ensure context is running
                source.connect(outputAudioContextRef.current.destination); // Connect directly to destination
                source.addEventListener('ended', () => {
                  audioSourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                audioSourcesRef.current.add(source);
              } catch (audioErr) {
                console.error('Error decoding or playing audio:', audioErr);
              }
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.turnComplete) {
              // Ensure the last model response is not "Listening..." if actual response came
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                // Remove 'Listening...' or ensure last model message isn't empty if a transcription was streamed
                if (lastMsg && lastMsg.role === 'model' && lastMsg.text === 'Listening...') {
                  return prev.slice(0, -1);
                }
                if (lastMsg && lastMsg.role === 'user' && !lastMsg.text) {
                  return prev.slice(0, -1); // Remove empty user turn
                }
                return prev;
              });
              // stopListening(); // Decide if you want to stop listening after each turn or keep it continuous
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setMessages(prev => [...prev, { role: 'model', text: 'Voice chat encountered an error.' }]);
            stopListening();
          },
          onclose: (e: CloseEvent) => {
            console.log('Live session closed:', e);
            stopListening(); // Ensure full cleanup
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });

    } catch (err) {
      console.error('Error starting microphone or live session:', err);
      setMessages(prev => [...prev, { role: 'model', text: 'Could not start voice chat. Please ensure microphone access is granted.' }]);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    setIsListening(false);
    setMessages(prev => prev.filter(msg => msg.text !== 'Listening...'));

    // Stop microphone stream
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(console.error);
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(console.error);
      outputAudioContextRef.current = null;
    }

    // Stop any playing audio
    for (const source of audioSourcesRef.current.values()) {
      source.stop();
    }
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Close Gemini Live session
    sessionPromiseRef.current?.then((session) => {
      session.close();
    }).catch(console.error);
    sessionPromiseRef.current = null;
    aiRef.current = null;
    console.log('Stopped listening and closed live session.');
  }, [isListening]);
  // --- End Live API integration ---


  return (
    <>
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col z-40 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center bg-primary text-white p-3 rounded-t-lg">
            <h3 className="font-bold">Support Chatbot</h3>
            <Button variant="outline" size="sm" onClick={toggleChat} className="!border-white !text-white hover:!bg-white hover:!text-primary dark:!border-white dark:!text-white dark:hover:!bg-white dark:hover:!text-primary">
              X
            </Button>
          </div>
          <div className="flex-grow p-3 overflow-y-auto custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                  msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 self-end ml-auto text-right text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-700 self-start mr-auto text-left text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div className="text-center py-2">
                <Spinner size="sm" />
              </div>
            )}
            {isListening && (
               <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                 <Spinner size="sm" className="mr-2" />
                 Listening...
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Type your message..."
              className="flex-grow !mb-0"
              disabled={loading || isListening}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim() || isListening} className="flex-shrink-0" size="sm">
              Send
            </Button>
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? 'danger' : 'secondary'}
              size="sm"
              className="flex-shrink-0"
              aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0 5.001 5.001 0 01-5 5.93V15a1 1 0 102 0v-2.062A9.001 9.001 0 003 8a1 1 0 00-2 0 11.001 11.001 0 0018 0 1 1 0 10-2 0 9.001 9.001 0 00-6 8.93V17h-2v-2.062z" clipRule="evenodd" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-secondary transition-colors duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Open Chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </>
  );
};

export default Chatbot;