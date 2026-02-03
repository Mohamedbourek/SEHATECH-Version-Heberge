<template>
  <button
    type="button"
    :class="[
      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
      'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2',
      'focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
    ]"
    :aria-pressed="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="sr-only"><slot /></span>
    <span
      :class="[
        'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow',
        'ring-0 transition duration-200 ease-in-out',
        modelValue ? 'translate-x-5' : 'translate-x-0'
      ]"
    >
      <span
        :class="[
          'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          modelValue ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
        ]"
        aria-hidden="true"
      >
        <XIcon class="h-3 w-3 text-gray-400" />
      </span>
      <span
        :class="[
          'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          modelValue ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
        ]"
        aria-hidden="true"
      >
        <CheckIcon class="h-3 w-3 text-primary-600" />
      </span>
    </span>
  </button>
</template>

<script setup>
import { CheckIcon, XIcon } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script> 