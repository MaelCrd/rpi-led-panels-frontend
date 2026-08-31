<template>
  <TopMenu />
  <br />

  <div v-if="!isBackendAlive" class="main-content">
    <div class="retry-container">
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
  </div>
  
  <AnimationList v-else @open-custom="handleOpenCustom" />

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

const { initSSE, isBackendAlive, clearRetryInterval, selectedGridItem } = useLedPanels();

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

<style scoped>
.main-content {
  padding: 1rem;
  padding-top: 0rem;
}

:deep(.p-progressspinner-circle) {
  stroke: rgb(195, 104, 0) !important;
}
</style>
