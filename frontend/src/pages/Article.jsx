import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchArticleById } from "../services/api";
import Article from "../components/Article";

const Articles = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect( () => {
    fetchArticleById(id).then((data) => {
        console.log("Fetched article:", data); // ✅ Now it logs the actual data
        setArticle(data[0]);
      }).catch((error) => {
        console.error("Error fetching article:", error);
      });
  }, [id]);

  if (!article) return <h2>Loading...</h2>;

  return (
    <Article article={article}/>
  );
};

export default Articles;
