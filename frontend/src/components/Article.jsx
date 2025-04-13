import React from "react";

const NewsCard = ({ article }) => (
    <div className="flex justify-center items-center min-h-screen bg-gray-200 h-25 p-4">
    <div className="max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{article.heading}</h1>
      <img
        src={article.image.url}
        alt={article.image.description}
        className="w-full h-64 object-cover rounded-lg shadow-md"
      />
      <p className="text-gray-700 mt-4 leading-relaxed">{article.data}</p>
      <h3 className="mt-6 text-sm text-gray-500 font-semibold">Keywords: {article.keywords.join(", ")}</h3>
    </div>
  </div>
);

export default NewsCard;
