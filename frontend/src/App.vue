<template>
  <div class="min-h-screen bg-gray-100 flex justify-center items-center">
    <HelloForm />
    <GreetingStream />
    <AddNumbers />
    <ChatStream />
  </div>
</template>

<script>
import HelloForm from "./components/HelloForm.vue";
import GreetingStream from "./components/GreetingStream.vue";
import AddNumbers from "./components/AddNumbers.vue"
import ChatStream from "./components/ChatStream.vue"

export default {
  components: {
    HelloForm,
    GreetingStream,
    AddNumbers,
    ChatStream
  },
};
</script>
