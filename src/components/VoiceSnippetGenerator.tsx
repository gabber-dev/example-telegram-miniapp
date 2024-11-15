import { useState, useEffect } from 'react';
import { useTelegram } from '@/context/TelegramContext';
import { fetchVoices, Voice, generateVoiceSnippet } from '@/actions';

export function VoiceSnippetGenerator() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { webApp } = useTelegram();

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setIsLoading(true);
        const voicesList = await fetchVoices();
        console.log('Fetched voices:', voicesList);
        
        if (Array.isArray(voicesList) && voicesList.length > 0) {
          setVoices(voicesList);
          setError(null);
        } else {
          const errorMsg = 'No valid voices received from the API';
          console.error(errorMsg, voicesList);
          setError(errorMsg);
          webApp?.showAlert(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch voices';
        console.error('Voice fetch error:', err);
        setError(errorMsg);
        webApp?.showAlert(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, [webApp]);

  const generateSnippet = async () => {
    if (!selectedVoice || !text) {
      webApp?.showAlert('Please select a voice and enter text');
      return;
    }

    setIsLoading(true);
    try {
      const audioSrc = await generateVoiceSnippet(text, selectedVoice);
      
      // Create audio element
      const audio = new Audio(audioSrc);
      
      // Add error handling for audio
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setError('Failed to load audio');
        webApp?.showAlert('Failed to load audio');
      };

      // Play audio
      try {
        await audio.play();
        setError(null);
      } catch (playError) {
        console.error('Playback error:', playError);
        setError('Failed to play audio');
        webApp?.showAlert('Failed to play audio. Please ensure you have granted audio permissions.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate snippet';
      setError(errorMsg);
      webApp?.showAlert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Voice Snippet Generator</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Select Voice
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            <option value="">Select a voice...</option>
            {Array.isArray(voices) && voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Text
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
          />
        </label>

        <button
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          onClick={generateSnippet}
          disabled={isLoading || !selectedVoice || !text}
        >
          {isLoading ? 'Generating...' : 'Generate Snippet'}
        </button>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 