"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, SessionProvider } from "gabber-client-react";
import { useTelegram } from "@/context/TelegramContext";
import { startGabberSession } from "@/actions";

type LogEntry = {
  message: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning';
};

interface GabberSession {
  connection_details: {
    url: string;
    token: string;
  };
  session: {
    id: string;
  };
}

export default function TelegramWebApp() {
  const { webApp } = useTelegram();
  const [sessionDetails, setSessionDetails] = useState<GabberSession | null>(null);
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

  const handleStartSession = useCallback(async () => {
    setIsInitializing(true);
    addLog('Initializing...', 'info');
    
    try {
      const data = await startGabberSession(
        '5c34d268-364f-4cd3-abf2-57afcf05ff3b',
        '1785821d-e3ec-489b-99bb-6d21a8e80441',
        '',
        180,
        '21892bb9-9809-4b6f-8c3e-e40093069f04'
      );

      const session = {
        connection_details: {
          url: data.connection_details.url,
          token: data.connection_details.token,
        },
        session: {
          id: data.session.id,
        }
      };

      setSessionDetails(session);
      addLog('Session started successfully', 'info');
      addLog(`Connection URL: ${session.connection_details.url}`, 'info');
      addLog(`Session ID: ${session.session.id}`, 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to start session: ${errorMessage}`, 'error');
      console.error('Failed to start session:', error);
      webApp?.showAlert('Failed to start session');
    } finally {
      setIsInitializing(false);
    }
  }, [webApp, addLog]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-center text-blue-800">Initializing session...</p>
        <LogViewer logs={logs} setLogs={setLogs} />
      </div>
    );
  }

  if (!sessionDetails) {
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
    <>
      <SessionProvider
        connectionDetails={sessionDetails.connection_details}
        connect={true}
      >
        <SimulatorWidget addLog={addLog} />
      </SessionProvider>
      <LogViewer logs={logs} setLogs={setLogs} />
    </>
  );
}

function SimulatorWidget({ addLog }: { addLog: (message: string, type?: LogEntry['type']) => void }) {
  const {
    connectionState,
    messages,
    microphoneEnabled,
    agentVolumeBands,
    agentState,
    transcription,
    setMicrophoneEnabled,
    sendChatMessage,
    startAudio,
    agentVolume,
    userVolume,
    remainingSeconds,
  } = useSession();
  const [inputMessage, setInputMessage] = useState("");
  const [audioPermissionDenied, setAudioPermissionDenied] = useState(false);
  const { webApp } = useTelegram();

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        await startAudio();
        addLog('Audio initialized successfully', 'info');
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setAudioPermissionDenied(true);
            addLog('Microphone permission denied', 'error');
            webApp?.showAlert('Please enable microphone access to use voice chat');
          } else {
            addLog(`Failed to initialize audio: ${error.message}`, 'error');
          }
        }
      }
    };

    if (connectionState === 'connected' && !audioPermissionDenied) {
      initAudio();
    }
  }, [connectionState, startAudio, addLog, webApp, audioPermissionDenied]);

  useEffect(() => {
    if (connectionState === 'connected') {
      addLog('Successfully connected to agent', 'info');
    }
  }, [connectionState, addLog]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendChatMessage({ text: inputMessage });
      setInputMessage("");
    }
  };

  if (connectionState === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Connecting to agent...</p>
      </div>
    );
  }

  if (connectionState === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">Failed to connect to agent</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#FF5925] text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-blue-600 h-[400px] w-full mx-auto flex flex-col overflow-hidden">
      <div className="p-2 flex-grow flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-blue-600">Gabber AI Chat</h3>
          <div className="text-sm">
            <span className="font-semibold">Status:</span> {connectionState}
          </div>
        </div>

        <div className="flex-grow flex flex-row overflow-hidden">
          {/* Left column - Controls and Metrics */}
          <div className="w-1/2 pr-2 flex flex-col">
            <button
              onClick={() => setMicrophoneEnabled(!microphoneEnabled)}
              className={`mb-2 px-2 py-1 rounded font-semibold ${
                microphoneEnabled
                  ? "bg-[#FF5925] hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white transition-colors`}
            >
              {microphoneEnabled ? "Disable Mic" : "Enable Mic"}
            </button>

            <div className="mb-2">
              <h4 className="font-semibold text-blue-600 mb-1 text-xs">
                Agent Volume:
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-[#FF5925] h-1.5 rounded-full"
                  style={{ width: `${agentVolume * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-2">
              <h4 className="font-semibold text-blue-600 mb-1 text-xs">
                User Volume:
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${userVolume * 100}%` }}
                />
              </div>
            </div>

            {remainingSeconds !== null && (
              <div className="mb-2">
                <h4 className="font-semibold text-blue-600 mb-1 text-xs">
                  Time Remaining:
                </h4>
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
            <div className="flex-grow overflow-y-auto bg-gray-50 p-1 rounded">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg mb-2 ${
                    msg.agent ? "bg-gray-100 ml-4" : "bg-blue-100 mr-4"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
              {transcription.text && (
                <div className="italic text-sm text-gray-500 px-2">
                  {transcription.text}
                </div>
              )}
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
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              className="flex-grow border-2 border-blue-600 rounded-l px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
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
