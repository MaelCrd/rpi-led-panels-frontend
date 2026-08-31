<template>
  <TopMenu />
  <br />

  <AnimationList v-if="isBackendAlive" @open-custom="handleOpenCustom" />

  <CustomDialog
    v-model:visible="customDialogVisible"
    :animation="currentCustomizingAnimation"
    @cancel="handleDialogCancel"
    @apply="handleDialogApply"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import TopMenu from "./components/TopMenu.vue";
import AnimationList from "./components/AnimationList.vue";
import CustomDialog from "./components/CustomDialog.vue";
import { useLedPanels } from "./composables/useLedPanels";

const { initSSE, isBackendAlive, clearRetryInterval, selectedGridItem } =
  useLedPanels();

const customDialogVisible = ref(false);
const currentCustomizingAnimation = ref(null);

onMounted(() => {
  initSSE();
});

onBeforeUnmount(() => {
  clearRetryInterval();
});

const handleOpenCustom = (animationItem) => {
  currentCustomizingAnimation.value = animationItem;
  customDialogVisible.value = true;
};

const handleDialogCancel = () => {
  if (currentCustomizingAnimation.value) {
    currentCustomizingAnimation.value.selectedOption = "Default";
  }
  currentCustomizingAnimation.value = null;
};

const handleDialogApply = (updatedAnimation) => {
  selectedGridItem.value = updatedAnimation;
  currentCustomizingAnimation.value = null;
};
</script>
