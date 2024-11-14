'use server'

import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://app.gabber.dev',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export async function startGabberSession(
  scenarioId: string,
  personaId: string,
  voice_override: string,
  time_limit_s: number = 180,
  llm: string
) {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.post('/api/v1/session/start', {
      persona: personaId,
      scenario: scenarioId,
      llm: llm,
      voice_override,
      time_limit_s,
      webhook: "https://app.gabber.dev/api/v1/internal/test/webhook",
    }, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to start session:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to start session');
  }
}

export async function generateToken() {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.post('/api/v1/usage/token', {
      // Add your request body here
    }, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to generate token:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate token');
  }
}
