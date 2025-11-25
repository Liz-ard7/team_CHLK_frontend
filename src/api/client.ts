import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to handle the { error: string } pattern from the backend
export const post = async <T>(url: string, body: any = {}): Promise<T> => {
  try {
    const response = await apiClient.post(url, body);
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    // Queries return arrays, Actions return objects.
    // The backend returns { result... } or [ result... ]
    return response.data;
  } catch (error: any) {
    console.error(`API Call Failed [${url}]:`, error);
    throw error.response?.data?.error || error.message || "Unknown Error";
  }
};

export default apiClient;
