// src/api/customAxios.js
import axios from "axios";

const customAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export default customAxios;
