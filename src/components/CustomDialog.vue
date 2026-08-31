<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :header="`${animation?.name || 'Animation'}`"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="flex flex-col gap-4">
      <div
        v-if="animation?.parameters && animation.parameters.length > 0"
        class="flex flex-col"
      >
        <div
          v-for="param in animation.parameters"
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
    </div>

    <template #footer>
      <Button label="Cancel" severity="secondary" @click="cancel" autofocus />
      <Button label="Apply" @click="apply" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { api } from "../services/api";
import { hexToNumeric, numericToHex } from "../utils/colorUtils";
import ImageCropper from "./ImageCropper.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  animation: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "cancel", "apply"]);

const customParameterValues = ref({});
const uploadedImageUrls = ref({});
const isConvertingHeic = ref(false);

const isTouchDevice =
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)")?.matches ||
    navigator.maxTouchPoints > 0);

const integerInputPassThrough = {
  pcInputText: {
    root: isTouchDevice ? { inputmode: "none" } : {},
  },
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.animation) {
      customParameterValues.value = {};
      if (props.animation.parameters && props.animation.parameters.length > 0) {
        props.animation.parameters.forEach((param) => {
          if (param.type === "color") {
            customParameterValues.value[param.internalName] =
              param.colorValue || numericToHex(param.value);
          } else {
            customParameterValues.value[param.internalName] = param.value;
          }
        });
      }
    } else {
      // Reset on close
      uploadedImageUrls.value = {};
    }
  },
);

const handleImageUpload = async (event, param) => {
  const file = event.files[0];
  if (file) {
    let processedFile = file;

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (isHeic) {
      isConvertingHeic.value = true;
      try {
        console.log("Converting HEIC file:", file.name);
        const { heicTo } = await import("heic-to");
        const convertedBlob = await heicTo({
          blob: file,
          type: "image/jpeg",
          quality: 0.92,
        });
        processedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          { type: "image/jpeg" },
        );
        console.log("HEIC conversion successful");
      } catch (error) {
        console.error("Error converting HEIC file:", error);
        alert("Failed to convert HEIC image.");
        isConvertingHeic.value = false;
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageUrls.value[param.internalName] = e.target.result;
      isConvertingHeic.value = false;
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      alert("Failed to read the image file. Please try again.");
      isConvertingHeic.value = false;
    };
    reader.readAsDataURL(processedFile);
  }
};

const handleCropUpdate = (cropData, param) => {
  customParameterValues.value[param.internalName] = cropData;
};

const apply = async () => {
  if (props.animation) {
    try {
      const apiParameters = { ...customParameterValues.value };
      if (props.animation.parameters) {
        props.animation.parameters.forEach((param) => {
          if (param.type === "color" && apiParameters[param.internalName]) {
            apiParameters[param.internalName] = hexToNumeric(
              apiParameters[param.internalName],
            );
          } else if (
            param.type === "string" &&
            apiParameters[param.internalName]
          ) {
            apiParameters[param.internalName] =
              apiParameters[param.internalName].base64Data;
          }
        });
      }

      await api.setAnimationParameters(props.animation.id, apiParameters);

      if (props.animation.parameters) {
        props.animation.parameters.forEach((param) => {
          if (customParameterValues.value[param.internalName] !== undefined) {
            if (param.type === "color") {
              param.colorValue =
                customParameterValues.value[param.internalName];
              param.value = hexToNumeric(
                customParameterValues.value[param.internalName],
              );
            } else {
              param.value = customParameterValues.value[param.internalName];
            }
          }
        });
      }

      emit("apply", props.animation);
      emit("update:visible", false);
    } catch (error) {
      console.error("Failed to apply custom parameters:", error);
    }
  }
};

const cancel = () => {
  emit("cancel");
  emit("update:visible", false);
};
</script>
