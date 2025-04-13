import React from "react";
import { Link } from "react-router-dom";

const NewsCard = ({ news }) => (
  <div className="news-card">
    <h2>
      <Link to={`/article/${news._id}`}>{news.heading}</Link>
    </h2>
    <img src={news.image.url} alt={news.image.description} width="100%" />
    <p>{news.data.substring(0, 100)}...</p>
    <Link to={`/article/${news._id}`}>Read More</Link>
  </div>
);

export default NewsCard;
