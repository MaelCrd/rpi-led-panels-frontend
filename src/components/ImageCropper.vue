<template>
  <div class="image-cropper-container">
    <div class="image-cropper" ref="cropperContainer">
      <!-- Original image for display -->
      <img
        ref="imageElement"
        :src="imageSrc"
        @load="onImageLoad"
        class="crop-image"
      />

      <!-- Selection rectangle overlay -->
      <div
        ref="selectionRect"
        class="selection-rectangle"
        :style="selectionStyle"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <div class="selection-border">
          <div class="selection-center">
            <i class="pi pi-arrows-v drag-icon"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview of cropped result -->
    <div class="crop-preview">
      <canvas
        ref="previewCanvas"
        width="256"
        height="128"
        class="preview-canvas"
      ></canvas>
      <p class="preview-label">Preview (256×128)</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";

const props = defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["crop-updated"]);

// Refs
const cropperContainer = ref(null);
const imageElement = ref(null);
const selectionRect = ref(null);
const previewCanvas = ref(null);

// State
const imageLoaded = ref(false);
const imageNaturalWidth = ref(0);
const imageNaturalHeight = ref(0);
const imageDisplayWidth = ref(0);
const imageDisplayHeight = ref(0);
const selectionTop = ref(0);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartTop = ref(0);

// Constants
const CROP_WIDTH = 256;
const CROP_HEIGHT = 128;

// Computed styles for selection rectangle
const selectionStyle = computed(() => {
  if (!imageLoaded.value) return {};

  // Calculate the correct selection height based on the 256:128 aspect ratio
  // but scaled to match the actual display width
  const selectionDisplayHeight = (imageDisplayWidth.value * CROP_HEIGHT) / CROP_WIDTH;
  
  return {
    top: `${selectionTop.value}px`,
    width: `${imageDisplayWidth.value}px`,
    height: `${selectionDisplayHeight}px`,
  };
});

// Handle image load
const onImageLoad = () => {
  const img = imageElement.value;
  if (!img) return;

  imageNaturalWidth.value = img.naturalWidth;
  imageNaturalHeight.value = img.naturalHeight;

  // Get the actual display width and height from the rendered image
  imageDisplayWidth.value = img.clientWidth;
  imageDisplayHeight.value = img.clientHeight;

  // Initialize selection at center
  const selectionDisplayHeight = (imageDisplayWidth.value * CROP_HEIGHT) / CROP_WIDTH;
  selectionTop.value = Math.max(
    0,
    (imageDisplayHeight.value - selectionDisplayHeight) / 2
  );

  imageLoaded.value = true;

  // Update crop after image is fully loaded
  nextTick(() => {
    updateCrop();
  });
};

// Mouse/touch event handlers
const startDrag = (event) => {
  event.preventDefault();
  isDragging.value = true;

  const clientY =
    event.type === "touchstart" ? event.touches[0].clientY : event.clientY;
  dragStartY.value = clientY;
  dragStartTop.value = selectionTop.value;

  // Add global listeners
  if (event.type === "touchstart") {
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  } else {
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  }
};

const onDrag = (event) => {
  if (!isDragging.value) return;

  event.preventDefault();
  const clientY =
    event.type === "touchmove" ? event.touches[0].clientY : event.clientY;
  const deltaY = clientY - dragStartY.value;
  const newTop = dragStartTop.value + deltaY;

  // Constrain selection within image bounds
  const selectionDisplayHeight =
    (imageDisplayWidth.value * CROP_HEIGHT) / CROP_WIDTH;
  const maxTop = imageDisplayHeight.value - selectionDisplayHeight;
  selectionTop.value = Math.max(0, Math.min(maxTop, newTop));

  updateCrop();
};

const stopDrag = () => {
  isDragging.value = false;

  // Remove global listeners
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("touchend", stopDrag);
};

// Update the crop and emit result
const updateCrop = () => {
  if (!imageLoaded.value || !previewCanvas.value) return;

  const canvas = previewCanvas.value;
  const ctx = canvas.getContext("2d");
  const img = imageElement.value;

  if (!img) return;

  // Calculate source coordinates in the original image
  const scaleX = imageNaturalWidth.value / imageDisplayWidth.value;
  const scaleY = imageNaturalHeight.value / imageDisplayHeight.value;

  const sourceX = 0;
  const sourceY = selectionTop.value * scaleY;
  const sourceWidth = imageNaturalWidth.value;
  // Calculate source height based on the selection rectangle height in display coordinates
  const selectionDisplayHeight = (imageDisplayWidth.value * CROP_HEIGHT) / CROP_WIDTH;
  const sourceHeight = selectionDisplayHeight * scaleY;

  // Clear canvas
  ctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

  // Improve canvas rendering quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the cropped portion
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    CROP_WIDTH,
    CROP_HEIGHT
  );

  // Get the cropped image data
  const base64Data = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];

  // Emit the result
  emit("crop-updated", {
    displayUrl: canvas.toDataURL("image/jpeg", 0.9),
    base64Data: base64Data,
  });
};

// Watch for image src changes
watch(
  () => props.imageSrc,
  () => {
    imageLoaded.value = false;
    selectionTop.value = 0;
  }
);
</script>

<style scoped>
.image-cropper-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.image-cropper {
  position: relative;
  display: block;
  width: 100%;
  border: 2.1px solid var(--p-border-color);
  border-radius: var(--p-border-radius-xl);
  overflow: hidden;
  background: var(--p-surface-50);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.crop-image {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
}

.selection-rectangle {
  position: absolute;
  left: 0;
  cursor: move;
  border: 2.1px solid #000000;
  background: rgba(0, 0, 0, 0.1);
  transition: none;
  z-index: 10;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.3);
}

.selection-rectangle:hover {
  border-color: #000000;
  background: rgba(0, 0, 0, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.selection-border {
  position: relative;
  width: 100%;
  height: 100%;
}

.selection-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #000000;
  font-size: 1.2rem;
  pointer-events: none;
  text-shadow: 0 0 3px var(--p-surface-0);
}

.drag-icon {
  filter: drop-shadow(0 0 2px var(--p-surface-0));
}

.crop-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.preview-canvas {
  border: 1px solid var(--p-border-color);
  border-radius: var(--p-border-radius-md);
  background: var(--p-surface-0);
  width: 100%;
  height: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-label {
  margin: 0;
  font-size: 0.875rem;
  color: var(--p-text-color-secondary);
  text-align: center;
}

/* Disable text selection during drag */
.image-cropper-container.dragging * {
  user-select: none;
}

/* Touch-friendly adjustments */
@media (max-width: 768px) {
  .selection-rectangle {
    border-width: 3px;
  }

  .selection-center {
    font-size: 1.4rem;
  }
}
</style>
