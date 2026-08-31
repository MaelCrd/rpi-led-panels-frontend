import { ref, watch } from 'vue';
import { api } from '../services/api';

const animations = ref([]);
const brightness = ref(0);
const checked = ref(false); // State (ON/OFF)
const selectedGridItem = ref(null);
const isInitializing = ref(true);
const isLoadingAnimations = ref(false);
const animationsLoaded = ref(false);
const isBackendAlive = ref(false);

const initSSE = () => {
  const sse = new EventSource(api.getSSEUrl());
  
  sse.onopen = () => {
    // If backend just came alive, or we reconnected, fetch the latest state
    if (!isBackendAlive.value) {
      isBackendAlive.value = true;
      loadAnimations();
    }
  };

  sse.onerror = (error) => {
    console.error("SSE Error:", error);
    isBackendAlive.value = false;
    animationsLoaded.value = false;
    sse.close();
    
    // Retry connection after 2 seconds
    setTimeout(initSSE, 2000);
  };
};

let animationsRetryInterval = null;

// Rate limiter variables
const requestQueue = [];
const maxRequestsPerSecond = 5;
const requestInterval = 1000 / maxRequestsPerSecond;
let lastRequestTime = 0;
let processingQueue = false;

const sendBrightnessRequest = async (brightnessValue) => {
  try {
    const response = await api.setBrightness(brightnessValue);
    console.log("Brightness Response:", response.data);
  } catch (error) {
    console.error("Brightness POST failed:", error);
  }
};

const sendStateRequest = async (stateValue) => {
  try {
    const stateNum = stateValue ? 1 : 0;
    const response = await api.setState(stateNum);
    console.log("State Response:", response.data);
  } catch (error) {
    console.error("State POST failed:", error);
  }
};

const processRequestQueue = () => {
  if (requestQueue.length === 0) {
    processingQueue = false;
    return;
  }

  processingQueue = true;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest >= requestInterval) {
    const value = requestQueue.shift();
    lastRequestTime = now;
    sendBrightnessRequest(value);

    if (requestQueue.length > 0) {
      setTimeout(processRequestQueue, requestInterval);
    } else {
      processingQueue = false;
    }
  } else {
    const waitTime = requestInterval - timeSinceLastRequest;
    setTimeout(processRequestQueue, waitTime);
  }
};

const rateLimitedBrightnessRequest = (value) => {
  if (requestQueue.length > 0) {
    requestQueue[requestQueue.length - 1] = value;
  } else {
    requestQueue.push(value);
  }

  if (!processingQueue) {
    processRequestQueue();
  }
};

watch(brightness, (newValue) => {
  if (!isInitializing.value) {
    rateLimitedBrightnessRequest(newValue);
  }
});

watch(checked, (newValue) => {
  if (!isInitializing.value) {
    sendStateRequest(newValue);
  }
});

const loadCurrentAnimation = async () => {
  try {
    const response = await api.getCurrentAnimation();
    let currentAnimationId = response.data;

    if (typeof currentAnimationId === "number") {
      currentAnimationId = currentAnimationId.toString();
    } else if (typeof currentAnimationId === "string") {
      currentAnimationId = currentAnimationId.replace(/['"]/g, "").trim();
    }

    const currentAnimation = animations.value.find(
      (anim) => anim.id === currentAnimationId
    );
    if (currentAnimation) {
      selectedGridItem.value = currentAnimation;
    }
  } catch (error) {
    console.error("Failed to load current animation:", error);
  }
};

const loadCurrentBrightness = async () => {
  try {
    const response = await api.getBrightness();
    let currentBrightness = response.data;

    if (typeof currentBrightness === "number") {
      brightness.value = currentBrightness * 10;
    } else if (typeof currentBrightness === "string") {
      brightness.value = parseFloat(currentBrightness) * 10;
    }
  } catch (error) {
    console.error("Failed to load current brightness:", error);
  }
};

const loadCurrentState = async () => {
  try {
    const response = await api.getState();
    let currentState = response.data;

    if (typeof currentState === "number") {
      checked.value = currentState === 1;
    } else if (typeof currentState === "string") {
      currentState = currentState.replace(/['"]/g, "").trim();
      checked.value = currentState === "1";
    }
  } catch (error) {
    console.error("Failed to load current state:", error);
  }
};

const loadAnimations = async (isRetry = false) => {
  if (!isRetry) {
    isLoadingAnimations.value = true;
  }

  try {
    const response = await api.getAnimations();
    const backendAnimations = response.data.animations;

    animations.value = backendAnimations.map((anim) => {
      let availableOptions = ["Default", "Preset", "Custom"];
      return {
        name: anim.name,
        id: anim.id.toString(),
        selectedOption: "Default",
        availableOptions: availableOptions,
        mode: anim.parameters.mode,
        parameters: anim.parameters.parameters || [],
      };
    });

    isLoadingAnimations.value = false;
    animationsLoaded.value = true;

    await loadCurrentAnimation();
    await loadCurrentBrightness();
    await loadCurrentState();

    if (animationsRetryInterval) {
      clearInterval(animationsRetryInterval);
      animationsRetryInterval = null;
    }

    isInitializing.value = false;
    return true;
  } catch (error) {
    console.error("Failed to load animations:", error);

    if (!isRetry) {
      animations.value = [];
      isLoadingAnimations.value = false;

      if (!animationsRetryInterval) {
        animationsRetryInterval = setInterval(() => {
          loadAnimations(true);
        }, 1000);
      }
    }
    return false;
  }
};

const clearRetryInterval = () => {
  if (animationsRetryInterval) {
    clearInterval(animationsRetryInterval);
    animationsRetryInterval = null;
  }
};

const setAnimationMode = async (animationId, mode) => {
  try {
    const modeValue = mode === "Default" ? 0 : mode === "Preset" ? 1 : 2;
    const response = await api.setAnimationMode(animationId, modeValue);
    console.log("Mode set response:", response.data);
  } catch (error) {
    console.error("Mode setting failed:", error);
  }
};

const selectGridItem = async (item) => {
  if (selectedGridItem.value?.id === item.id) {
    return;
  }
  selectedGridItem.value = item;
  await setAnimationMode(item.id, item.selectedOption);
};

export function useLedPanels() {
  return {
    animations,
    brightness,
    checked,
    selectedGridItem,
    isInitializing,
    isLoadingAnimations,
    animationsLoaded,
    isBackendAlive,
    initSSE,
    loadAnimations,
    clearRetryInterval,
    setAnimationMode,
    selectGridItem
  };
}

