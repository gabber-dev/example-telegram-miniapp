'use server'

import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://app.gabber.dev',
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
    const response = await axiosInstance.post('https://app.gabber.dev/api/v1/usage/token', {
      human_id: userId,
      limits: [{
        type: "conversational_seconds",
        value: 180
      }]
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
    const response = await axiosInstance.post('https://app.gabber.dev/api/v1/voice/generate', {
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
    const response = await axiosInstance.get('/api/v1/voice/list', {
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