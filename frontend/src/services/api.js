import axios from "axios";

const API_URL = "http://localhost:8002/api/news";

export const fetchNews = async () => (await axios.get(API_URL)).data;
export const fetchPendingNews = async () => (await axios.get(`${API_URL}/pending`)).data;
export const approveNews = async (id) => (await axios.post(`${API_URL}/approve/${id}`)).data;
export const rejectNews = async (id) => (await axios.post(`${API_URL}/reject/${id}`)).data;
export const fetchArticleById = async (id) => 
    (await axios.get(`http://localhost:8002/api/news/${id}`)).data;
  