import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const API_URL = API_BASE_URL;

export async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/login`, { email, password });
    const data = response.data;
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function register(userData) {
  try {
    const response = await axios.post(`${API_URL}/api/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
