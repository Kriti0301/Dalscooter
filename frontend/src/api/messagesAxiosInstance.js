import axios from "axios";

const messagesAxios = axios.create({
  baseURL: "https://egjjgeedfi.execute-api.us-east-1.amazonaws.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default messagesAxios;
