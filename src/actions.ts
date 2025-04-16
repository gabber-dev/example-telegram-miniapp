'use server'

import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://api.gabber.dev',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export async function generateToken(userId: string) {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }
  console.log('Generating token for user:', userId);
  try {
    const response = await axiosInstance.post('https://api.gabber.dev/v1/usage/token', {
      human_id: userId,
      ttl_seconds: 3600
    }, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });
    console.log('Token response:', response.data);
    
    if (!response.data.token) {
      throw new Error('No token in response');
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Token generation failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          data: error.config?.data
        }
      });
      throw new Error(`Token generation failed: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export async function generateVoiceSnippet(text: string, voiceId: string) {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.post('https://api.gabber.dev/v1/voice/generate', {
      text,
      voice_id: voiceId
    }, {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'audio/mpeg',
      },
      responseType: 'arraybuffer'
    });
    
    // Convert the array buffer to base64
    const audioData = Buffer.from(response.data).toString('base64');
    return `data:audio/mpeg;base64,${audioData}`;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Voice generation failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Voice generation failed: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export interface Voice {
  id: string;
  name: string;
  language?: string;
}

// Add this new function
export async function fetchVoices(): Promise<Voice[]> {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.get('/v1/voice/list', {
      headers: {
        'X-Api-Key': apiKey,
      }
    });

    if (!response.data || !response.data.values) {
      throw new Error('Invalid response format: missing values array');
    }

    const validVoices = response.data.values
      .filter(voice => voice && typeof voice.id === 'string' && typeof voice.name === 'string')
      .map(voice => ({
        id: voice.id,
        name: voice.name,
        language: voice.language || undefined
      }));

    if (validVoices.length === 0) {
      throw new Error('No valid voices found in response');
    }

    return validVoices;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Voice fetch failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch voices: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export interface LLM {
  id: string;
  name: string;
  project?: string;
}

export interface PersonaTag {
  human_name: string;
  name: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  project?: string;
  tags?: PersonaTag[];
  voice?: string;
}

export interface Scenario {
  id: string;
  name: string;
  project?: string;
  prompt?: string;
}

export async function fetchLLMs(): Promise<LLM[]> {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.get('/v1/llm/list', {
      headers: {
        'X-Api-Key': apiKey,
      }
    });

    if (!response.data || !response.data.values) {
      throw new Error('Invalid response format: missing values array');
    }

    const validLLMs = response.data.values
      .filter(llm => llm && typeof llm.id === 'string' && typeof llm.name === 'string')
      .map(llm => ({
        id: llm.id,
        name: llm.name,
        project: llm.project || undefined
      }));

    if (validLLMs.length === 0) {
      throw new Error('No valid LLMs found in response');
    }

    return validLLMs;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('LLM fetch failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch LLMs: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export async function fetchPersonas(): Promise<Persona[]> {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.get('/v1/persona/list', {
      headers: {
        'X-Api-Key': apiKey,
      }
    });

    if (!response.data || !response.data.values) {
      throw new Error('Invalid response format: missing values array');
    }

    const validPersonas = response.data.values
      .filter(persona => persona && typeof persona.id === 'string' && typeof persona.name === 'string')
      .map(persona => ({
        id: persona.id,
        name: persona.name,
        description: persona.description,
        image_url: persona.image_url || undefined,
        project: persona.project || undefined,
        tags: persona.tags || undefined,
        voice: persona.voice || undefined
      }));

    if (validPersonas.length === 0) {
      throw new Error('No valid personas found in response');
    }

    return validPersonas;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Persona fetch failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch personas: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const apiKey = process.env.GABBER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not found');
  }

  try {
    const response = await axiosInstance.get('/v1/scenario/list', {
      headers: {
        'X-Api-Key': apiKey,
      }
    });

    if (!response.data || !response.data.values) {
      throw new Error('Invalid response format: missing values array');
    }

    const validScenarios = response.data.values
      .filter(scenario => scenario && typeof scenario.id === 'string' && typeof scenario.name === 'string')
      .map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        project: scenario.project || undefined,
        prompt: scenario.prompt || undefined
      }));

    if (validScenarios.length === 0) {
      throw new Error('No valid scenarios found in response');
    }

    return validScenarios;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Scenario fetch failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to fetch scenarios: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}


export async function sendVoiceToTelegram(audioBase64: string, chatId: string) {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    throw new Error('Telegram bot token not found');
  }

  try {
    // Convert base64 to Blob
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64;
    
    const byteCharacters = Buffer.from(base64Data, 'base64');
    const blob = new Blob([byteCharacters], { type: 'audio/ogg' }); // Correct format

    // Create form data
    const formData = new FormData();
    formData.append('voice', blob, 'voice_message.ogg');
    formData.append('chat_id', chatId);

    console.log('Sending voice to Telegram:', formData);
    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Failed to send voice message');
    }

    return data;
  } catch (error) {
    console.error('Failed to send voice to Telegram:', error);
    throw error;
  }
}
