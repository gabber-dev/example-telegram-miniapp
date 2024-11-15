"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSession, SessionProvider } from "gabber-client-react";
import { useTelegram } from "@/context/TelegramContext";
import { ConnectOptions } from 'gabber-client-core';
import { generateToken, generateVoiceSnippet } from '@/actions';

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
      <div className="flex items-center justify-center h-screen">
        <p className="text-center text-blue-800">Generating token...</p>
        <LogViewer logs={logs} setLogs={setLogs} />
      </div>
    );
  }

  if (!connectOptions) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <button
          onClick={handleStartSession}
          className="bg-[#FF5925] text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors mb-4"
        >
          Start Chat Session
        </button>
        <LogViewer logs={logs} setLogs={setLogs} />
      </div>
    );
  }

  return (
    <SessionProvider connectionOpts={connectOptions} connect={true}>
      <SimulatorWidget addLog={addLog} logs={logs} setLogs={setLogs} webApp={webApp} />
    </SessionProvider>
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
    <>
      <div className="bg-white rounded-lg shadow-md border-2 border-blue-600 h-[400px] w-full mx-auto flex flex-col overflow-hidden">
        <div className="p-2 flex-grow flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Gabber AI Chat</h3>
          <div className="flex-grow flex flex-row overflow-hidden">
            {/* Left column - Controls */}
            <div className="w-1/2 pr-2 flex flex-col">
              <div className="mb-1 text-xs text-gray-600">
                <span className="font-semibold">Connection:</span> {connectionState}
              </div>
              
              <button
                onClick={() => setMicrophoneEnabled(prevState => !prevState)}
                className={`mb-2 px-2 py-1 rounded font-semibold text-xs ${
                  microphoneEnabled
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white transition-colors`}
              >
                {microphoneEnabled ? "Disable Mic" : "Enable Mic"}
              </button>

              <div className="mb-2">
                <h4 className="font-semibold text-blue-600 mb-1 text-xs">Agent Volume:</h4>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-[#FF5925] h-1.5 rounded-full"
                    style={{ width: `${agentVolume * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-2">
                <h4 className="font-semibold text-blue-600 mb-1 text-xs">User Volume:</h4>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${userVolume * 100}%` }}
                  />
                </div>
              </div>

              {remainingSeconds !== null && (
                <div className="mb-2">
                  <h4 className="font-semibold text-blue-600 mb-1 text-xs">Remaining Time:</h4>
                  <div className={`text-sm font-semibold ${
                    remainingSeconds > 10 ? "text-[#FF5925]" : "text-red-600"
                  }`}>
                    {remainingSeconds} seconds
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Messages */}
            <div className="w-1/2 pl-2 border-l border-gray-200 flex flex-col">
              <h4 className="font-semibold text-blue-600 mb-1 text-xs">Messages:</h4>
              <div className="flex-grow overflow-y-auto bg-gray-50 p-3 rounded mb-2 h-[280px]">
                <div className="flex flex-col space-y-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.agent ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2 rounded-lg ${
                          msg.agent 
                            ? "bg-white border border-gray-200" 
                            : "bg-[#FF5925] text-white"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {transcription.text && (
                    <div className="text-xs text-gray-500 italic text-center">
                      {transcription.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="p-2 border-t border-gray-200 mt-2">
            <div className="flex">
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
                className="flex-grow border-2 border-blue-600 rounded-l px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#FF5925] text-white px-4 py-1 rounded-r font-semibold hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <LogViewer logs={logs} setLogs={setLogs} />
    </>
  );
}

function LogViewer({ logs, setLogs }: { logs: LogEntry[], setLogs: (logs: LogEntry[]) => void }) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black bg-opacity-80 text-white p-2 max-h-40 overflow-y-auto">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-bold">Debug Logs</h3>
        <button 
          onClick={() => setLogs([])} 
          className="text-xs bg-red-500 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>
      {logs.map((log, i) => (
        <div key={i} className={`text-xs mb-1 ${
          log.type === 'error' ? 'text-red-400' :
          log.type === 'warning' ? 'text-yellow-400' : 'text-green-400'
        }`}>
          [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
        </div>
      ))}
    </div>
  );
}
