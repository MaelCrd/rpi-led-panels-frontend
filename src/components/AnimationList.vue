<template>
  <div class="main-content">
    <DataView :value="animations" layout="list" v-if="animations.length > 0">
      <template #list="slotProps">
        <div class="custom-list">
          <div
            v-for="item in slotProps.items"
            :key="item.id"
            class="list-item"
            @click="onSelectGridItem(item)"
            :class="{ selected: selectedGridItem?.id === item.id }"
          >
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
                  @click.stop="(event) => handleSelectButtonClick(event, item)"
                />
              </template>
            </Card>
          </div>
        </div>
      </template>
    </DataView>
    <br />
  </div>
</template>

<script setup>
import { useLedPanels } from "../composables/useLedPanels";

const emit = defineEmits(["open-custom"]);

const {
  animations,
  animationsLoaded,
  selectedGridItem,
  selectGridItem,
  setAnimationMode,
} = useLedPanels();

const onSelectGridItem = (item) => {
  selectGridItem(item);
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
    emit("open-custom", animationItem);
  }
};

const handleSelectButtonClick = (event, animationItem) => {
  const clickedButton = event.target.closest("button");
  if (clickedButton) {
    const buttonText = clickedButton.textContent.trim();

    if (buttonText === "Custom" && animationItem.selectedOption === "Custom") {
      selectedGridItem.value = animationItem;
      emit("open-custom", animationItem);
    }
  }
};
</script>

<style scoped>
.main-content {
  padding: 1rem;
  padding-top: 0rem;
}

.list-item {
  border-radius: var(--p-border-radius-xl);
  transition: all 0.25s ease;
  border: 2.1px solid #00000000;
  padding: 0px;
  margin: 0px 0px 1rem 0px;
  width: 100%;
}

.list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.list-item.selected {
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.5);
  border: 2.1px solid #000000;
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

:deep(.p-progressspinner-circle) {
  stroke: rgb(195, 104, 0) !important;
}

:deep(.p-dataview-content) {
  background: transparent !important;
}
</style>
