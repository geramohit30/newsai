import React, { useState, useEffect } from "react";
import { fetchPendingNews, approveNews, rejectNews } from "../services/api";
import Article from "../components/Article";

const Admin = () => {
  const [pendingNews, setPendingNews] = useState([]);

  useEffect(() => {
    const getPending = async () => {
      try {
        const news = await fetchPendingNews();
        setPendingNews(news.data);
      } catch (error) {
        console.error("Failed to fetch pending news:", error);
      }
    };
    getPending();
  }, []);

  const handleApprove = async (id, selectedImage) => {
    try {
      console.log("Got following id:",id
      )
      let resp = await approveNews(id, selectedImage);
      console.log("approve ", resp)
      setPendingNews(prev => prev.filter(article => article._id !== id));
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectNews(id);
      setPendingNews(prev => prev.filter(article => article._id !== id));
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  return (
    <div>
      <h1>Admin Panel 🛠</h1>
      {pendingNews.length > 0 ? (
        pendingNews.map((article) => (
          <Article
            key={article._id}
            article={article}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))
      ) : (
        <p>No pending articles</p>
      )}
    </div>
  );
};

export default Admin;
