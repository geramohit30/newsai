import React, { useState, useEffect } from "react";

const Article = ({ article, onApprove, onReject, isPreview = false }) => {
  const [selectedImage, setSelectedImage] = useState(article.image);
  const [isApproved, setIsApproved] = useState(article.approved);

  useEffect(() => {
    setSelectedImage(article.image);
    setIsApproved(article.approved);
  }, [article]);

  const handleApproveClick = async () => {
    if (!selectedImage) {
      alert("Please select an image before approving.");
      return;
    }
    await onApprove(article._id, selectedImage);
    setIsApproved(true);
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px", borderRadius: "8px" }}>
      <h2>{article.heading}</h2>
      <p>{article.data}</p>

        <p>{article.image}</p>
      <div style={{ margin: "15px 0" }}>
        <strong>Selected Image:</strong>
        <img
          src={article.image}
          alt="Selected"
          style={{
            width: "100%",
            maxHeight: "300px",
            objectFit: "cover",
            border: "2px solid black",
            marginBottom: "10px",
            borderRadius: "6px"
          }}
        />
      </div>

      {/* {!isApproved && (
        <>
          <h4>Select Image:</h4>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {article.images.map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt={`img-${index}`}
                style={{
                  width: "150px",
                  height: "100px",
                  objectFit: "cover",
                  cursor: "pointer",
                  border: selectedImage === img.url ? "3px solid green" : "1px solid gray",
                  borderRadius: "6px"
                }}
                onClick={() => setSelectedImage(img.url)}
              />
            ))}
          </div>
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={handleApproveClick}
              style={{
                padding: "10px 20px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                cursor: "pointer",
                marginRight: "10px"
              }}
            >
              ✅ Approve
            </button>
            {onReject && (
              <button
                onClick={() => onReject(article._id)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                ❌ Reject
              </button>
            )}
          </div>
        </>
      )} */}

      {/* {isApproved && !isPreview && (
        <p style={{ color: "green", marginTop: "20px" }}>✅ This article has been approved.</p>
      )} */}
    </div>
  );
};

export default Article;
