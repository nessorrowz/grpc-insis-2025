<template>
    <div class="p-4">
      <h2 class="text-lg font-bold mb-4">Say Hello</h2>
      <input v-model="name" placeholder="Enter your name" class="border p-2" />
      <button @click="sendHello" class="ml-2 px-4 py-2 bg-blue-500 text-white">Send</button>
      <p v-if="response" class="mt-4 text-green-700">Server says: {{ response }}</p>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        name: "",
        response: null,
      };
    },
    methods: {
      async sendHello() {
        try {
          const res = await axios.post("http://localhost:3000/sayHello", {
            name: this.name,
          });
          this.response = res.data.message;
        } catch (err) {
          this.response = "Error: " + err.message;
        }
      },
    },
  };
  </script>
  