"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSession, SessionProvider } from "gabber-client-react";
import { useTelegram } from "@/context/TelegramContext";
import { ConnectOptions } from 'gabber-client-core';
import { 
  generateToken, 
  generateVoiceSnippet, 
  fetchLLMs,
  fetchPersonas,
  fetchScenarios,
  fetchVoices,
  LLM,
  Persona,
  Scenario,
  Voice 
} from '@/actions';
import { VoiceSnippetGenerator } from './VoiceSnippetGenerator';
import { SessionSetup } from './SessionSetup';

type LogEntry = {
  message: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning';
};

export default function TelegramWebApp() {
  const { webApp } = useTelegram();
  const [token, setToken] = useState<string | null>(null);
  const [connectOptions, setConnectOptions] = useState<ConnectOptions | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    if (type === 'error') {
      webApp?.showAlert(`Error: ${message}`);
    }
  }, [webApp]);

  const fetchToken = useCallback(async () => {
    try {
      const userId = webApp?.initDataUnsafe?.user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const tokenData = await generateToken(userId.toString());
      setToken(tokenData.token);
      addLog('Token generated successfully', 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to get token: ${errorMessage}`, 'error');
      console.error('Failed to get token:', error);
      webApp?.showAlert('Failed to get token');
    }
  }, [webApp, addLog]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const handleStartSession = useCallback(() => {
    setIsInitializing(true);
    addLog('Initializing...', 'info');
    
    try {
      const options: ConnectOptions = {
        token: token!,
        sessionConnectOptions: {
          history: [],
          llm: '21892bb9-9809-4b6f-8c3e-e40093069f04',
          voice_override: 'f1377b9b-f85d-4bdc-a3a2-c6c7322a3d0a'
        }
      };

      setConnectOptions(options);
      addLog('Session initialized successfully', 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to initialize session: ${errorMessage}`, 'error');
      console.error('Failed to initialize session:', error);
      webApp?.showAlert('Failed to initialize session');
    } finally {
      setIsInitializing(false);
    }
  }, [token, webApp, addLog]);

  const handleGenerateVoice = useCallback(async (text: string, voiceId: string) => {
    try {
      addLog('Generating voice snippet...', 'info');
      const audioSrc = await generateVoiceSnippet(text, voiceId);
      
      // Create audio element
      const audio = new Audio(audioSrc);
      
      // Add error handling for audio
      audio.onerror = (e) => {
        addLog(`Audio playback error: ${e}`, 'error');
      };

      // Play audio
      try {
        await audio.play();
        addLog('Voice snippet played successfully', 'info');
      } catch (playError) {
        addLog(`Playback failed: ${playError}`, 'error');
        webApp?.showAlert('Failed to play audio. Please ensure you have granted audio permissions.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to generate voice: ${errorMessage}`, 'error');
      webApp?.showAlert('Failed to generate voice');
    }
  }, [addLog, webApp]);

  if (!token) {
    return (
      <div className="min-h-screen p-4">
        <p className="text-lg font-bold text-center mb-4">Generating token...</p>
        <VoiceSnippetGenerator />
        <LogViewer logs={logs} setLogs={setLogs} />
      </div>
    );
  }

  if (!connectOptions) {
    return (
      <div className="min-h-screen p-4">
        <SessionSetup 
          isLoading={isInitializing}
          onStart={({ llmId, personaId, scenarioId, voiceId }) => {
            setIsInitializing(true);
            addLog('Initializing with selected options...', 'info');
            
            try {
              const options: ConnectOptions = {
                token: token!,
                sessionConnectOptions: {
                  history: [],
                  ...(llmId && { llm: llmId }),
                  ...(voiceId && { voice_override: voiceId }),
                  persona: personaId,
                  scenario: scenarioId
                }
              };

              setConnectOptions(options);
              addLog('Session initialized successfully', 'info');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              addLog(`Failed to initialize session: ${errorMessage}`, 'error');
              console.error('Failed to initialize session:', error);
              webApp?.showAlert('Failed to initialize session');
            } finally {
              setIsInitializing(false);
            }
          }}
        />
        <VoiceSnippetGenerator />
        <LogViewer logs={logs} setLogs={setLogs} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <SessionProvider connectionOpts={connectOptions} connect={true}>
        <SimulatorWidget addLog={addLog} logs={logs} setLogs={setLogs} webApp={webApp} />
      </SessionProvider>
      <VoiceSnippetGenerator />
    </div>
  );
}

function SimulatorWidget({ addLog, logs, setLogs, webApp }) {
  const {
    connectionState,
    messages,
    microphoneEnabled,
    transcription,
    setMicrophoneEnabled,
    sendChatMessage,
    agentVolume,
    userVolume,
    remainingSeconds,
    error: sessionError
  } = useSession();

  const [inputMessage, setInputMessage] = useState('');
  const prevConnectionState = useRef(connectionState);

  useEffect(() => {
    if (sessionError) {
      addLog(`Session error: ${sessionError}`, 'error');
    }
  }, [sessionError, addLog]);

  useEffect(() => {
    if (prevConnectionState.current !== connectionState) {
      addLog(`Connection state: ${connectionState}`, 'info');
      prevConnectionState.current = connectionState;
    }
  }, [connectionState, addLog]);

  const handleSendMessage = useCallback(() => {
    if (inputMessage.trim()) {
      sendChatMessage({ text: inputMessage });
      setInputMessage('');
    }
  }, [inputMessage, sendChatMessage]);

  useEffect(() => {
    const messagesContainer = document.querySelector('.overflow-y-auto');
    if (messagesContainer && messages.length > 0) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Chat Container */}
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold">Gabber AI Chat</h3>
          <div className="text-sm text-gray-500">
            Status: {connectionState}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Controls */}
          <div className="space-y-4">
            <button
              onClick={() => setMicrophoneEnabled(prev => !prev)}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                microphoneEnabled ? 'bg-red-500' : 'bg-blue-500'
              }`}
            >
              {microphoneEnabled ? 'Disable Mic' : 'Enable Mic'}
            </button>

            {/* Volume Indicators */}
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Agent Volume</label>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${agentVolume * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">User Volume</label>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${userVolume * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {remainingSeconds !== null && (
              <div className="text-sm font-medium">
                Time Remaining: {remainingSeconds}s
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto border border-gray-100 rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.agent ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.agent ? 'bg-gray-100' : 'bg-blue-500 text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {transcription.text && (
                <div className="text-sm text-gray-500 italic text-center">
                  {transcription.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      <LogViewer logs={logs} setLogs={setLogs} />
    </div>
  );
}

function LogViewer({ logs, setLogs }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 max-h-48 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Logs</h3>
        <button 
          onClick={() => setLogs([])} 
          className="bg-red-500 px-3 py-1 rounded-md text-sm"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`text-sm ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'warning' ? 'text-yellow-400' : 
              'text-green-400'
            }`}
          >
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
