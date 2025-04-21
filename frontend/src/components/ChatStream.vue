<template>
    <h2>Chat Stream</h2>
    <div class="p-4 max-w-lg mx-auto">
      <div class="border p-3 rounded mb-4 h-64 overflow-y-auto bg-gray-100">
        <div v-for="(msg, idx) in messages" :key="idx">
          <strong>{{ msg.sender }}:</strong> {{ msg.message }}
        </div>
      </div>
  
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input v-model="newMessage" class="flex-1 border px-3 py-2 rounded" placeholder="Type a message..." />
        <button class="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const messages = ref([])
const newMessage = ref('')
const clientId = Date.now().toString() // ID unik per sesi user
let eventSource = null

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const payload = {
    clientId,
    sender: 'Client',
    message: newMessage.value
  }

  // Kirim pesan ke backend
  await axios.post('http://localhost:3000/api/chat/send', payload)

  // Tambahkan ke daftar pesan lokal
  messages.value.push({ sender: 'Client', message: newMessage.value })

  newMessage.value = ''
}

onMounted(() => {
  // Setup EventSource untuk menerima balasan
  eventSource = new EventSource(`http://localhost:3000/api/chat/stream?clientId=${clientId}`)

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    messages.value.push({ sender: data.sender, message: data.message })
  }

  eventSource.onerror = (err) => {
    console.error('SSE error:', err)
    eventSource.close()
  }
})

onUnmounted(() => {
  if (eventSource) eventSource.close()
})
</script>
