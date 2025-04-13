import React, { useState, useEffect } from "react";
import { fetchPendingNews, approveNews, rejectNews } from "../services/api";

const Admin = () => {
  const [pendingNews, setPendingNews] = useState([]);

  useEffect(() => {
    fetchPendingNews().then(setPendingNews);
  }, []);

  const handleApprove = async (id) => {
    await approveNews(id);
    setPendingNews(pendingNews.filter(news => news._id !== id));
  };

  const handleReject = async (id) => {
    await rejectNews(id);
    setPendingNews(pendingNews.filter(news => news._id !== id));
  };

  return (
    <div>
      <h1>Admin Panel 🛠</h1>
      {pendingNews.map((item) => (
        <div key={item._id} className="news-card">
          <h2>{item.heading}</h2>
          <button onClick={() => handleApprove(item._id)}>✅ Approve</button>
          <button onClick={() => handleReject(item._id)}>❌ Reject</button>
        </div>
      ))}
    </div>
  );
};

export default Admin;
