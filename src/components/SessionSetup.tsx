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
    <div className="max-w-md mx-auto space-y-6 p-4">
      <h2 className="text-xl font-bold text-center mb-8">Session Setup</h2>
      
      {/* LLM Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select LLM
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={selectedLLM}
          onChange={(e) => setSelectedLLM(e.target.value)}
        >
          <option value="">Select LLM...</option>
          {llms.map((llm) => (
            <option key={llm.id} value={llm.id}>
              {llm.name}
            </option>
          ))}
        </select>
      </div>

      {/* Persona Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Persona
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
      </div>

      {/* Scenario Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Scenario
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
      </div>

      {/* Voice Selection (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Voice (Optional)
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isLoading || !selectedPersona || !selectedScenario}
        className="w-full mt-8 py-3 px-4 bg-blue-500 text-white rounded-md font-medium 
                 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 
                 transition-colors duration-200"
      >
        {isLoading ? 'Starting...' : 'Start Session'}
      </button>
    </div>
  );
}