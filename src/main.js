import { createApp } from 'vue';
import App from './App.vue';

import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import 'primeicons/primeicons.css';     // Icons CSS
import './style.css';                   // Custom global CSS

import Button from "primevue/button"
import ToggleButton from 'primevue/togglebutton';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import DataView from 'primevue/dataview';
import Card from 'primevue/card';
import Slider from 'primevue/slider';
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import ColorPicker from 'primevue/colorpicker';
import ProgressSpinner from 'primevue/progressspinner';
import FileUpload from 'primevue/fileupload';

const Noir = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{zinc.950}',
                    inverseColor: '#ffffff',
                    hoverColor: '{zinc.900}',
                    activeColor: '{zinc.800}'
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            },
            dark: {
                primary: {
                    color: '{zinc.50}',
                    inverseColor: '{zinc.950}',
                    hoverColor: '{zinc.100}',
                    activeColor: '{zinc.200}'
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Noir, options: {
            darkModeSelector: '.dark-mode', // system | .dark-mode
            themeColorSelector: '.theme-color'
        }
    }
});

// Example: globally register a PrimeVue Button component
app.component('Button', Button);
app.component('ToggleButton', ToggleButton);
app.component('InputNumber', InputNumber);
app.component('Message', Message);
app.component('DataView', DataView);
app.component('Card', Card);
app.component('Slider', Slider);
app.component('SelectButton', SelectButton);
app.component('Dialog', Dialog);
app.component('FloatLabel', FloatLabel);
app.component('ColorPicker', ColorPicker);
app.component('ProgressSpinner', ProgressSpinner);
app.component('FileUpload', FileUpload);

app.mount('#app');
