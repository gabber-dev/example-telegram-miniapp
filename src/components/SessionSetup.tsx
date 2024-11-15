import { useState, useEffect } from 'react';
import { fetchLLMs, fetchPersonas, fetchScenarios, fetchVoices, LLM, Persona, Scenario, Voice } from '@/actions';
import { useTelegram } from "@/context/TelegramContext";

interface SessionSetupProps {
  onStart: (options: {
    llmId?: string;
    personaId: string;
    scenarioId: string;
    voiceId?: string;
  }) => void;
  isLoading: boolean;
}

export function SessionSetup({ onStart, isLoading }: SessionSetupProps) {
  const [llms, setLLMs] = useState<LLM[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  
  const [selectedLLM, setSelectedLLM] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const { webApp } = useTelegram();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [llmsList, personasList, scenariosList, voicesList] = await Promise.all([
          fetchLLMs(),
          fetchPersonas(),
          fetchScenarios(),
          fetchVoices()
        ]);

        setLLMs(llmsList);
        setPersonas(personasList);
        setScenarios(scenariosList);
        setVoices(voicesList);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMsg);
        webApp?.showAlert(errorMsg);
      }
    };

    loadData();
  }, [webApp]);

  const handleStart = () => {
    if (!selectedPersona || !selectedScenario) {
      webApp?.showAlert('Please select a persona and scenario');
      return;
    }

    onStart({
      ...(selectedLLM && { llmId: selectedLLM }),
      personaId: selectedPersona,
      scenarioId: selectedScenario,
      ...(selectedVoice && { voiceId: selectedVoice })
    });
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="text-xl font-bold text-blue-600">Session Setup</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">
            Select LLM (Optional)
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedLLM}
              onChange={(e) => setSelectedLLM(e.target.value)}
            >
              <option value="">Use Default LLM</option>
              {llms.map((llm) => (
                <option key={llm.id} value={llm.id}>
                  {llm.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Select Persona
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
            >
              <option value="">Select Persona...</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Select Scenario
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
            >
              <option value="">Select Scenario...</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Select Voice (Optional)
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              <option value="">Use Persona Default Voice</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isLoading || !selectedPersona || !selectedScenario}
        className="bg-[#FF5925] text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Starting...' : 'Start Chat Session'}
      </button>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}