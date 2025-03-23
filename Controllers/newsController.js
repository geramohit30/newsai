const News = require('../Models/newsModel');
const Headings = require('../Models/headingModel')
exports.getNews = async (req, res) => {
    try {
        
        const headings = await Headings.find();
        res.json(headings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching news", error: error.message });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        console.log("Finding the ID : ", req.params.id);
        
        const newsItem = await News.find({"article_id":req.params.id})
        if (!newsItem) return res.status(404).json({ message: "News not found" });

        res.json(newsItem);
    } catch (error) {
        res.status(500).json({ message: "Error fetching news", error: error.message });
    }
};
