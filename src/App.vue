<template>
  <!-- Top Menu -->
  <div class="top-menu">
    <div class="menu-left">
      <Slider
        v-model="brightness"
        :min="0"
        :max="1000"
        :disabled="!animationsLoaded"
        class="w-full"
      />
    </div>
    <div class="menu-right">
      <ToggleButton
        style="width: 77px"
        v-model="checked"
        :disabled="!animationsLoaded"
        onLabel="ON"
        offLabel="OFF"
        onIcon="pi pi-sun"
        offIcon="pi pi-power-off"
        class="custom-toggle-button"
      />
    </div>
  </div>

  <br />

  <div class="main-content">
    <!-- Loading indicator for animations -->

    <!-- Retry indicator when animations failed to load -->
    <div
      v-if="animations.length === 0 && animationsRetryInterval"
      class="retry-container"
    >
      <Message
        size="normal"
        severity="warn"
        :closable="false"
        icon="pi pi-spin pi-spinner"
      >
        <template #icon>
          <ProgressSpinner
            style="width: 20px; height: 20px; margin: 0.3rem"
            strokeWidth="4"
            animationDuration="1.3s"
          />
        </template>
        <span>Connection failed. Retrying...</span>
      </Message>
    </div>

    <DataView :value="animations" layout="list" v-if="animations.length > 0">
      <template #list="slotProps">
        <div class="custom-list">
          <div
            v-for="item in slotProps.items"
            :key="item.id"
            class="list-item"
            @click="selectGridItem(item)"
            :class="{ selected: selectedGridItem?.id === item.id }"
          >
            <!-- list item content -->
            <Card>
              <template #title>
                <div class="animation-title">
                  <i class="pi pi-bullseye animation-icon"></i>
                  {{ item.name }}
                </div>
              </template>
              <template #footer>
                <SelectButton
                  v-model="item.selectedOption"
                  label="Select"
                  :class="{
                    'p-button-outlined': selectedGridItem?.id !== item.id,
                  }"
                  icon="pi pi-check"
                  :options="item.availableOptions"
                  :allowEmpty="false"
                  :fluid="true"
                  @change="(event) => handleAnimationOptionChange(event, item)"
                  @click.native="
                    (event) => handleSelectButtonClick(event, item)
                  "
                />
              </template>
            </Card>
          </div>
        </div>
      </template>
    </DataView>

    <br />
  </div>

  <!-- Custom Dialog -->
  <Dialog
    v-model:visible="customDialogVisible"
    modal
    :header="`${currentCustomizingAnimation?.name || 'Animation'}`"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="flex flex-col gap-4">
      <!-- Dynamic parameter rendering -->
      <div
        v-if="
          currentCustomizingAnimation?.parameters &&
          currentCustomizingAnimation.parameters.length > 0
        "
        class="flex flex-col"
      >
        <div
          v-for="param in currentCustomizingAnimation.parameters"
          :key="param.internalName"
          class="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg"
          style="margin-bottom: 1rem"
        >
          <!-- Integer parameter -->
          <div v-if="param.type === 'int'" class="flex flex-col gap-1">
            <label :for="param.internalName"
              >{{ param.name }} ({{ param.min }} - {{ param.max }})</label
            >
            <div style="margin-bottom: 0.5rem"></div>
            <InputNumber
              :id="param.internalName"
              v-model="customParameterValues[param.internalName]"
              :min="param.min"
              :max="param.max"
              :step="1"
              :pt="integerInputPassThrough"
              fluid
              showButtons
              buttonLayout="horizontal"
            />
          </div>

          <!-- Float parameter -->
          <div v-if="param.type === 'float'" class="flex flex-col gap-1">
            <label :for="param.internalName" class="mb-5"
              >{{ param.name }} ({{ +param.min.toFixed(2) }} -
              {{ +param.max.toFixed(2) }})</label
            >
            <div
              class="items-center gap-4 mt-2 flex"
              style="display: flex; align-items: center"
            >
              <Slider
                :id="param.internalName"
                v-model="customParameterValues[param.internalName]"
                :min="param.min"
                :max="param.max"
                :step="0.01"
                :label="test"
                class="w-full"
                style="flex-basis: 82%; margin: 0.8rem 0"
              />
              <span
                class="text-sm text-gray-600"
                style="flex-basis: 18%; text-align: right"
              >
                {{
                  +customParameterValues[param.internalName]?.toFixed(2) ||
                  +param.value?.toFixed(2)
                }}
              </span>
            </div>
          </div>

          <!-- Image parameter -->
          <div v-if="param.type === 'string'" class="flex flex-col gap-1">
            <FloatLabel>
              <FileUpload
                :id="param.internalName"
                mode="basic"
                customUpload
                auto
                severity="secondary"
                @uploader="(event) => handleImageUpload(event, param)"
                accept="image/*,.heic,.heif"
                :maxFileSize="5000000"
                :disabled="isConvertingHeic"
              />
            </FloatLabel>
            <label :for="param.internalName">{{ param.name }}</label>

            <!-- HEIC Conversion Loading Indicator -->
            <div
              v-if="isConvertingHeic"
              class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <ProgressSpinner
                style="width: 20px; height: 20px"
                strokeWidth="4"
                animationDuration="1s"
              />
              <span class="text-sm text-blue-700"
                >Converting HEIC image...</span
              >
            </div>

            <!-- Image Cropper Component -->
            <ImageCropper
              v-if="uploadedImageUrls[param.internalName]"
              :image-src="uploadedImageUrls[param.internalName]"
              @crop-updated="(cropData) => handleCropUpdate(cropData, param)"
              class="mt-2"
            />

            <span
              v-if="customParameterValues[param.internalName]"
              class="text-sm text-gray-600"
            >
              Cropped to 256x128 pixels
            </span>
          </div>

          <!-- Color parameter -->
          <div v-if="param.type === 'color'" class="flex flex-col gap-1">
            <ColorPicker
              :id="param.internalName"
              v-model="customParameterValues[param.internalName]"
              format="hex"
              fluid
              style="border: 0.3px solid #a0a0a0; border-radius: 6px"
            />
            <label :for="param.internalName" style="margin-left: 0.5rem">{{
              param.name
            }}</label>
          </div>
        </div>
      </div>

      <!-- Show message if no parameters - REMOVED per user request -->
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="cancelCustomSettings"
        autofocus
      />
      <Button label="Apply" @click="applyCustomSettings" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import ImageCropper from "./components/ImageCropper.vue";

const selectedGridItem = ref(null);
const checked = ref(false);
const customDialogVisible = ref(false);
const currentCustomizingAnimation = ref(null);

const animations = ref([]);
const brightness = ref(0);
const customSpeed = ref(50);
const customParameterValues = ref({});
const uploadedImageUrls = ref({});
const isInitializing = ref(true);
const isLoadingAnimations = ref(false);
const animationsLoaded = ref(false);
const isConvertingHeic = ref(false);
const isTouchDevice =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)")?.matches ||
    navigator.maxTouchPoints > 0);
const integerInputPassThrough = {
  pcInputText: {
    root: isTouchDevice
      ? {
          inputmode: "none",
        }
      : {},
  },
};
let animationsRetryInterval = null;

// API Base URL
//const API_BASE_URL = "http://pi.local:8000";
const API_BASE_URL = "http://192.168.1.63:8000";

// Color conversion utilities
const hexToNumeric = (hexColor) => {
  // Remove # if present and convert to number
  const hex = hexColor.replace("#", "");
  return parseInt(hex, 16);
};

const numericToHex = (numericValue) => {
  // Convert number to hex and pad with zeros, add #
  const hex = Math.floor(numericValue).toString(16).padStart(6, "0");
  return `#${hex.toUpperCase()}`;
};

// Load animations from backend with retry logic
const loadAnimations = async (isRetry = false) => {
  if (!isRetry) {
    isLoadingAnimations.value = true;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/animations`);
    const backendAnimations = response.data.animations;

    animations.value = backendAnimations.map((anim) => {
      // Determine available options based on animation's mode
      let availableOptions = ["Default", "Preset", "Custom"];

      return {
        name: anim.name,
        id: anim.id.toString(),
        selectedOption: "Default", // Always start with Default
        availableOptions: availableOptions,
        mode: anim.parameters.mode,
        parameters: anim.parameters.parameters || [],
      };
    });

    console.log("Loaded animations:", animations.value);
    isLoadingAnimations.value = false;
    animationsLoaded.value = true;

    // Load and set current animation, brightness, and state after animations are loaded
    await loadCurrentAnimation();
    await loadCurrentBrightness();
    await loadCurrentState();

    // Clear retry interval if it exists (successful load)
    if (animationsRetryInterval) {
      clearInterval(animationsRetryInterval);
      animationsRetryInterval = null;
    }

    return true; // Success
  } catch (error) {
    console.error("Failed to load animations:", error);

    if (!isRetry) {
      // Fallback to empty array if request fails initially
      animations.value = [];
      isLoadingAnimations.value = false;

      // Start retry interval if not already running
      if (!animationsRetryInterval) {
        console.log("Starting retry for animations every 1 second...");
        animationsRetryInterval = setInterval(() => {
          console.log("Retrying to load animations...");
          loadAnimations(true);
        }, 1000);
      }
    }

    return false; // Failure
  }
};

// Load current animation from backend
const loadCurrentAnimation = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/animation`);
    let currentAnimationId = response.data;

    // Handle different response formats (number or string)
    if (typeof currentAnimationId === "number") {
      currentAnimationId = currentAnimationId.toString();
    } else if (typeof currentAnimationId === "string") {
      // Remove any extra quotes or whitespace
      currentAnimationId = currentAnimationId.replace(/['"]/g, "").trim();
    }

    console.log("Current animation ID from backend:", currentAnimationId);
    console.log("Available animations:", animations.value);

    // Find and select the current animation
    const currentAnimation = animations.value.find(
      (anim) => anim.id === currentAnimationId,
    );
    if (currentAnimation) {
      selectedGridItem.value = currentAnimation;
      console.log("Selected current animation:", currentAnimation);
    } else {
      console.log("Could not find animation with ID:", currentAnimationId);
      console.log(
        "Available animation IDs:",
        animations.value.map((a) => a.id),
      );
    }
  } catch (error) {
    console.error("Failed to load current animation:", error);
  }
};

// Load current brightness from backend
const loadCurrentBrightness = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/brightness`);
    let currentBrightness = response.data;

    // Handle different response formats
    if (typeof currentBrightness === "number") {
      // Backend returns brightness in 0-100 range, convert to 0-1000 for UI
      brightness.value = currentBrightness * 10;
    } else if (typeof currentBrightness === "string") {
      brightness.value = parseFloat(currentBrightness) * 10;
    }

    console.log("Current brightness from backend:", currentBrightness);
    console.log("UI brightness value:", brightness.value);
  } catch (error) {
    console.error("Failed to load current brightness:", error);
    // Keep default brightness value if request fails
  }
};

// Load current state from backend
const loadCurrentState = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/state`);
    let currentState = response.data;

    // Handle different response formats and convert to boolean
    if (typeof currentState === "number") {
      checked.value = currentState === 1;
    } else if (typeof currentState === "string") {
      // Remove any extra quotes or whitespace and convert
      currentState = currentState.replace(/['"]/g, "").trim();
      checked.value = currentState === "1";
    }

    console.log("Current state from backend:", currentState);
    console.log("UI checked value:", checked.value);
  } catch (error) {
    console.error("Failed to load current state:", error);
    // Keep default state value if request fails
  }
};

// Initialize data on component mount
onMounted(async () => {
  await loadAnimations();

  // Enable brightness watcher after initial load
  isInitializing.value = false;
});

// Rate limiter to allow max 5 requests per second
const requestQueue = [];
const maxRequestsPerSecond = 5;
const requestInterval = 1000 / maxRequestsPerSecond; // 200ms between requests

let lastRequestTime = 0;
let processingQueue = false;

const rateLimitedBrightnessRequest = (value) => {
  // Add to queue or update latest value if queue not empty
  if (requestQueue.length > 0) {
    requestQueue[requestQueue.length - 1] = value; // Update latest value
  } else {
    requestQueue.push(value);
  }

  if (!processingQueue) {
    processRequestQueue();
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
    // Send request immediately
    const value = requestQueue.shift();
    lastRequestTime = now;
    sendBrightnessRequest(value);

    // Continue processing queue
    if (requestQueue.length > 0) {
      setTimeout(processRequestQueue, requestInterval);
    } else {
      processingQueue = false;
    }
  } else {
    // Wait for the remaining time
    const waitTime = requestInterval - timeSinceLastRequest;
    setTimeout(processRequestQueue, waitTime);
  }
};

// Watch brightness changes and send rate-limited requests
watch(brightness, (newValue) => {
  // Don't send requests during initial load
  if (!isInitializing.value) {
    rateLimitedBrightnessRequest(newValue);
  }
});

// Watch state changes and send requests
watch(checked, (newValue) => {
  // Don't send requests during initial load
  if (!isInitializing.value) {
    sendStateRequest(newValue);
  }
});

const formData = ref({
  amount: 5,
});

const selectGridItem = async (item) => {
  // Avoid sending request if this animation is already selected
  if (selectedGridItem.value?.id === item.id) {
    return;
  }

  selectedGridItem.value = item;
  console.log("Selected grid item:", item);

  // Set the mode based on the selected option (this also sets the animation)
  await setAnimationMode(item.id, item.selectedOption);
};

const sendBrightnessRequest = async (brightnessValue) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/brightness/${Math.floor(brightnessValue / 10.0)}`,
    );
    console.log("Brightness Response:", response.data);
  } catch (error) {
    console.error("Brightness POST failed:", error);
  }
};

const sendStateRequest = async (stateValue) => {
  try {
    const stateNum = stateValue ? 1 : 0;
    const response = await axios.post(`${API_BASE_URL}/state/${stateNum}`);
    console.log("State Response:", response.data);
  } catch (error) {
    console.error("State POST failed:", error);
  }
};

const setAnimationMode = async (animationId, mode) => {
  try {
    const modeValue = mode === "Default" ? 0 : mode === "Preset" ? 1 : 2;
    const response = await axios.post(
      `${API_BASE_URL}/animation/${animationId}/mode/${modeValue}`,
    );
    console.log("Mode set response:", response.data);
  } catch (error) {
    console.error("Mode setting failed:", error);
  }
};

const applyCustomSettings = async () => {
  // Handle custom animation settings for specific animation
  if (currentCustomizingAnimation.value) {
    console.log(
      "Applying custom settings for",
      currentCustomizingAnimation.value.name,
      ":",
      {
        animationId: currentCustomizingAnimation.value.id,
        parameters: customParameterValues.value,
      },
    );

    try {
      // Prepare parameters for API - convert color hex values to numeric and handle image data
      const apiParameters = { ...customParameterValues.value };

      if (currentCustomizingAnimation.value.parameters) {
        currentCustomizingAnimation.value.parameters.forEach((param) => {
          if (param.type === "color" && apiParameters[param.internalName]) {
            // Convert hex color to numeric value for API
            apiParameters[param.internalName] = hexToNumeric(
              apiParameters[param.internalName],
            );
          } else if (
            param.type === "string" &&
            apiParameters[param.internalName]
          ) {
            // For image parameters, send only the base64 data
            apiParameters[param.internalName] =
              apiParameters[param.internalName].base64Data;
          }
        });
      }

      // Send custom parameters to backend
      await axios.post(
        `${API_BASE_URL}/animation/${currentCustomizingAnimation.value.id}/parameters`,
        apiParameters,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Save the updated parameter values back to the animation object
      if (currentCustomizingAnimation.value.parameters) {
        currentCustomizingAnimation.value.parameters.forEach((param) => {
          if (customParameterValues.value[param.internalName] !== undefined) {
            if (param.type === "color") {
              // Store both the hex value and numeric value
              param.colorValue =
                customParameterValues.value[param.internalName];
              param.value = hexToNumeric(
                customParameterValues.value[param.internalName],
              );
            } else {
              // For other parameters, update the value directly
              param.value = customParameterValues.value[param.internalName];
            }
          }
        });
      }

      // Select the animation after setting parameters
      selectedGridItem.value = currentCustomizingAnimation.value;

      console.log("Custom parameters applied successfully");
    } catch (error) {
      console.error("Failed to apply custom parameters:", error);
    }
  }
  // Clear uploaded image URLs after applying
  uploadedImageUrls.value = {};
  customDialogVisible.value = false;
  currentCustomizingAnimation.value = null;
};

const cancelCustomSettings = () => {
  // Revert to Default option if Custom was cancelled
  if (currentCustomizingAnimation.value) {
    currentCustomizingAnimation.value.selectedOption = "Default";
  }
  // Clear uploaded image URLs
  uploadedImageUrls.value = {};
  customDialogVisible.value = false;
  currentCustomizingAnimation.value = null;
};

const handleAnimationOptionChange = async (event, animationItem) => {
  console.log(
    "Animation option changed:",
    event.value,
    "for animation:",
    animationItem.name,
  );

  // Always select this animation when changing options
  selectedGridItem.value = animationItem;

  // Set the animation mode
  await setAnimationMode(animationItem.id, event.value);

  if (event.value === "Custom") {
    // Open custom dialog for parameter configuration
    currentCustomizingAnimation.value = animationItem;

    // Initialize parameter values with defaults
    customParameterValues.value = {};
    if (animationItem.parameters && animationItem.parameters.length > 0) {
      animationItem.parameters.forEach((param) => {
        if (param.type === "color") {
          // For color parameters, initialize with the hex value
          customParameterValues.value[param.internalName] =
            param.colorValue || numericToHex(param.value);
        } else {
          // For other parameters, use the numeric value
          customParameterValues.value[param.internalName] = param.value;
        }
      });
    }

    customDialogVisible.value = true;
  }
};

const handleSelectButtonClick = (event, animationItem) => {
  // Check if the clicked button is "Custom" and is already selected
  const clickedButton = event.target.closest("button");
  if (clickedButton) {
    const buttonText = clickedButton.textContent.trim();

    if (buttonText === "Custom" && animationItem.selectedOption === "Custom") {
      // Re-open the custom dialog
      currentCustomizingAnimation.value = animationItem;
      selectedGridItem.value = animationItem;

      // Initialize parameter values with defaults
      customParameterValues.value = {};
      if (animationItem.parameters && animationItem.parameters.length > 0) {
        animationItem.parameters.forEach((param) => {
          if (param.type === "color") {
            // For color parameters, initialize with the hex value
            customParameterValues.value[param.internalName] =
              param.colorValue || numericToHex(param.value);
          } else {
            // For other parameters, use the numeric value
            customParameterValues.value[param.internalName] = param.value;
          }
        });
      }

      customDialogVisible.value = true;
    }
  }
};

const handleImageUpload = async (event, param) => {
  const file = event.files[0];
  if (file) {
    let processedFile = file;

    // Check if the file is HEIC format
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (isHeic) {
      // Show loading indicator for HEIC conversion
      isConvertingHeic.value = true;

      try {
        console.log("Converting HEIC file:", file.name);

        // Convert HEIC to JPEG using heic-to
        const { heicTo } = await import("heic-to");
        const convertedBlob = await heicTo({
          blob: file,
          type: "image/jpeg",
          quality: 0.92, // Higher quality for better color preservation
        });

        // heic-to returns a single blob (not an array like heic2any)
        const finalBlob = convertedBlob;

        // Create a new File object from the converted blob
        processedFile = new File(
          [finalBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          { type: "image/jpeg" },
        );

        console.log("HEIC conversion successful");
      } catch (error) {
        console.error("Error converting HEIC file:", error);
        alert(
          "Failed to convert HEIC image. Please try a different image or convert it manually.",
        );
        isConvertingHeic.value = false; // Hide loading indicator on error
        return; // Exit early if conversion fails
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Store the image URL for the cropper component
      uploadedImageUrls.value[param.internalName] = e.target.result;

      // Hide loading indicator when processing is complete
      isConvertingHeic.value = false;
    };

    reader.onerror = () => {
      console.error("Failed to read file");
      alert("Failed to read the image file. Please try again.");
      // Hide loading indicator on error
      isConvertingHeic.value = false;
    };

    reader.readAsDataURL(processedFile);
  }
};

const handleCropUpdate = (cropData, param) => {
  // Store the cropped image data for the API
  customParameterValues.value[param.internalName] = cropData;
};

// Cleanup intervals on component unmount
onBeforeUnmount(() => {
  if (animationsRetryInterval) {
    clearInterval(animationsRetryInterval);
    animationsRetryInterval = null;
  }
});
</script>

<style scoped>
.top-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
  padding-left: 1.8rem;
  padding-right: 1rem;
  /* background-color: var(--p-surface-100); */
  background-color: var(--p-surface-0);
  border-bottom: 1px solid var(--p-border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-left {
  flex: 1;
  min-width: 0; /* Prevents flex item from overflowing */
}

.menu-right {
  flex-shrink: 0;
}

.main-content {
  padding: 1rem;
  padding-top: 0rem;
}

.list-item {
  border-radius: var(--p-border-radius-xl);
  transition: all 0.25s ease;
  /* transition: border-color 0.25s ease; */
  border: 2.1px solid #00000000;
  padding: 0px;
  margin: 0px 0px 1rem 0px;
  width: 100%;
}

.list-item:hover {
  /* transform: translateY(-2px); */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.list-item.selected {
  /* transform: translateY(-2px); */
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.5);
}

.list-item.selected {
  border: 2.1px solid #000000;
  /* background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); */
}

.animation-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.animation-icon {
  font-size: 1rem;
  color: var(--p-primary-color);
  flex-shrink: 0;
}

/* Fix ProgressSpinner inner color and set stroke to black */
:deep(.p-progressspinner-circle) {
  /* fill: transparent !important; */
  stroke: rgb(195, 104, 0) !important;
}

:deep(.p-dataview-content) {
  background: transparent !important;
}
</style>
