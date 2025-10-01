const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  isUser: boolean;
}

export interface QuickResponse {
  id: string;
  title: string;
  message: string;
}

export interface ChatbotResponse {
  response: string;
  timestamp: string;
}

export interface HazardAnalysis {
  analysis: string;
  hazardType: string;
  location: string;
  timestamp: string;
}

export interface SafetyGuidelines {
  guidelines: string;
  hazardType: string;
  timestamp: string;
}

// Send a chat message to the AI
export const sendChatMessage = async (message: string, context?: string): Promise<ChatbotResponse> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chatbot/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return data.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Get AI analysis of a hazard
export const getHazardAnalysis = async (
  hazardType: string, 
  location: string, 
  description: string
): Promise<HazardAnalysis> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chatbot/analyze-hazard`, {
      method: 'POST',
      body: JSON.stringify({ hazardType, location, description }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get hazard analysis');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting hazard analysis:', error);
    throw error;
  }
};

// Get safety guidelines for a hazard type
export const getSafetyGuidelines = async (hazardType: string): Promise<SafetyGuidelines> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chatbot/safety-guidelines/${encodeURIComponent(hazardType)}`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get safety guidelines');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting safety guidelines:', error);
    throw error;
  }
};

// Get predefined quick responses
export const getQuickResponses = async (): Promise<QuickResponse[]> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/chatbot/quick-responses`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get quick responses');
    }

    return data.data.quickResponses;
  } catch (error) {
    console.error('Error getting quick responses:', error);
    throw error;
  }
};
