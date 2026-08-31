<template>
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
</template>

<script setup>
import { useLedPanels } from "../composables/useLedPanels";

const { brightness, checked, animationsLoaded } = useLedPanels();
</script>

<style scoped>
.top-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
  padding-left: 1.8rem;
  padding-right: 1rem;
  background-color: var(--p-surface-0);
  border-bottom: 1px solid var(--p-border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-left {
  flex: 1;
  min-width: 0;
}

.menu-right {
  flex-shrink: 0;
}
</style>
