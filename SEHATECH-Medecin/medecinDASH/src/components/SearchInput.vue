<template>
  <div class="relative">
    <div class="relative">
      <input
        type="text"
        class="input"
        v-model="searchQuery"
        :placeholder="placeholder"
        @focus="showResults = true"
        @blur="handleBlur"
      />
      <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    </div>

    <div v-if="showResults && searchResults.length > 0"
         class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
      <ul class="py-1">
        <li v-for="item in searchResults"
            :key="item.id"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            @mousedown="selectItem(item)">
          <slot name="item" :item="item">
            <div class="font-medium text-gray-900">{{ item.name }}</div>
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder: string
  searchFunction: (query: string) => Promise<any[]>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', item: any): void
}>()

const searchQuery = ref('')
const showResults = ref(false)
const searchResults = ref<any[]>([])

const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const selectItem = (item: any) => {
  searchQuery.value = item.name
  emit('update:modelValue', item.name)
  emit('select', item)
  showResults.value = false
}

// Watch for search query changes
watch(searchQuery, async (newQuery) => {
  if (newQuery.length >= 2) {
    searchResults.value = await props.searchFunction(newQuery)
  } else {
    searchResults.value = []
  }
})
</script>
