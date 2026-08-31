import axios from "axios";

// API Base URL
//const API_BASE_URL = "http://pi.local:8000";
const API_BASE_URL = "http://192.168.1.63:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  getSSEUrl: () => `${API_BASE_URL}/sse`,
  getAnimations: () => apiClient.get("/animations"),
  getCurrentAnimation: () => apiClient.get("/animation"),
  getBrightness: () => apiClient.get("/brightness"),
  getState: () => apiClient.get("/state"),
  
  setBrightness: (brightnessValue) => apiClient.post(`/brightness/${Math.floor(brightnessValue / 10.0)}`),
  setState: (stateNum) => apiClient.post(`/state/${stateNum}`),
  
  setAnimationMode: (animationId, modeValue) => apiClient.post(`/animation/${animationId}/mode/${modeValue}`),
  setAnimationParameters: (animationId, parameters) => apiClient.post(
    `/animation/${animationId}/parameters`,
    parameters,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  ),
};

