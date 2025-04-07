const News = require('../Models/newsModel');
const Headings = require('../Models/headingModel')
exports.getNews = async (req, res) => {
    try {
        const news = await News.find({ approved: true });
        res.status(200).json(news);
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved news", error: error.message });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        console.log("Finding the ID : ", req.params.id);
        
        const newsItem = await News.find({"article_id":req.params.id, "approved": true })
        if (!newsItem) return res.status(404).json({ message: "News not found" });

        res.json(newsItem);
    } catch (error) {
        res.status(500).json({ message: "Error fetching news", error: error.message });
    }
};


exports.getPendingNews = async (req, res) => {
    try {
        const pendingNews = await News.find({ approved: false });
        res.status(200).json(pendingNews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending news", error: error.message });
    }
};

exports.approveNewsById = async (req, res) => {
    try {
        const articleId = req.params.id;
        console.log("Finding the article_id:", articleId);

        const newsItem = await News.findOne({ article_id: articleId });
        if (!newsItem) {
            return res.status(404).json({ message: "News not found" });
        }

        if (newsItem.approved) {
            return res.status(200).json({ message: "News already approved", data: newsItem });
        }

        newsItem.approved = true;
        await newsItem.save();

        res.status(200).json({ message: "News approved successfully", data: newsItem });
    } catch (error) {
        console.error("Error approving news:", error);
        res.status(500).json({ message: "Error approving news", error: error.message });
    }
};
