import {
  ItButton,
  ItCheckbox,
  ItField,
  ItInput,
  ItOption,
  ItRadio,
  ItRange,
  ItSelect,
  ItTextarea,
} from '@infinitylib/infinity-theme-vue'

/**
 * The theme wrappers are a package, not a Nuxt layer: register them once so
 * every screen uses the shared design system instead of local markup.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('ItButton', ItButton)
  nuxtApp.vueApp.component('ItCheckbox', ItCheckbox)
  nuxtApp.vueApp.component('ItField', ItField)
  nuxtApp.vueApp.component('ItInput', ItInput)
  nuxtApp.vueApp.component('ItOption', ItOption)
  nuxtApp.vueApp.component('ItRadio', ItRadio)
  nuxtApp.vueApp.component('ItRange', ItRange)
  nuxtApp.vueApp.component('ItSelect', ItSelect)
  nuxtApp.vueApp.component('ItTextarea', ItTextarea)
})
