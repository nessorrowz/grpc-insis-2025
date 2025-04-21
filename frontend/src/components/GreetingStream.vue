<template>
    <div class="greeting-stream">
      <h2>Stream Greetings</h2>
      <input v-model="name" placeholder="Enter your name" />
      <button @click="getGreetings">Start Stream</button>
  
      <ul v-if="greetings.length">
        <li v-for="(msg, index) in greetings" :key="index">{{ msg }}</li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import axios from "axios";
  
  const name = ref("");
  const greetings = ref([]);
  
  const getGreetings = async () => {
    greetings.value = []; // Clear previous
    try {
      const response = await axios.get("http://localhost:3000/api/stream-greetings", {
        params: { name: name.value },
      });
      greetings.value = response.data.greetings;
    } catch (error) {
      console.error("Failed to stream greetings:", error.message);
    }
  };
  </script>
  
  <style scoped>
  .greeting-stream {
    padding: 1rem;
  }
  input {
    margin-right: 8px;
  }
  </style>
  