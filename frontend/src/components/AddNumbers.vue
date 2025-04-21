<template>
    <div class="add-numbers">
      <h2>Add Numbers (Client Streaming)</h2>
      <input v-model.number="newNumber" type="number" placeholder="Enter number" />
      <button @click="addToList">Add</button>
      <ul>
        <li v-for="(num, index) in numbers" :key="index">{{ num }}</li>
      </ul>
      <button @click="submitNumbers">Submit to gRPC</button>
      <div v-if="result !== null">
        <p><strong>Result Sum:</strong> {{ result }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        newNumber: null,
        numbers: [],
        result: null,
      };
    },
    methods: {
      addToList() {
        if (this.newNumber !== null) {
          this.numbers.push(this.newNumber);
          this.newNumber = null;
        }
      },
      async submitNumbers() {
        try {
          const response = await axios.post("http://localhost:3000/api/add-numbers", {
            numbers: this.numbers,
          });
          this.result = response.data.sum;
        } catch (error) {
          console.error("Failed to add numbers:", error);
          alert("Error while adding numbers");
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .add-numbers {
    padding: 1rem;
  }
  input {
    margin-right: 0.5rem;
  }
  </style>
  