import axios from "axios";

const API_URL = "http://localhost:8003/api/articles";

export const fetchNews = async () => (await axios.get(API_URL)).data;
export const fetchPendingNews = async () => (await axios.get(`${API_URL}/pending`)).data;
export const rejectNews = async (id) => (await axios.post(`${API_URL}/reject/${id}`)).data;
export const fetchArticleById = async (id) => 
    (await axios.get(`http://localhost:8003/api/article/${id}`)).data;
export const approveNews = async (id, selectedImageUrl) => {
    console.log('The image', selectedImageUrl);
    return (
      await axios.post(
        `http://localhost:8003/api/article/approve/${id}`,
        { selectedImageUrl }, // ✅ short-hand property
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    ).data;
  };
  
  