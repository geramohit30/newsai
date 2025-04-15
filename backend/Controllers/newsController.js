const News = require('../Models/newsModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
exports.getNews = async (req, res) => {
    try {
        const { categories } = req.query;
        let newsList = [];
        
        let matchedQuery = { approved: true };
        if (categories) {
          const categoryArray = categories.split(",").map(cat => cat.trim());
          matchedQuery.categories = { $in: categoryArray };
        
          const matchingNews = await News.find(matchedQuery, {
            heading: 1,image: 1,approved: 1,feedId: 1,categories:1, data:1, createdAt:1, keywords:1 
          }).sort({ createdAt: -1 }).limit(15);
        
          const matchedIds = matchingNews.map(item => item._id);
        
          const remainingCount = 15 - matchingNews.length;
          let fillerNews = [];
        
          if (remainingCount > 0) {
            fillerNews = await News.aggregate([
              { $match: { approved: true, _id: { $nin: matchedIds } } },
              { $sample: { size: remainingCount } },
              { $project: { heading: 1,image: 1,approved: 1,feedId: 1,categories:1, data:1, createdAt:1, keywords:1 } }
            ]);
          }
        
          newsList = [...matchingNews, ...fillerNews];
        } else {

          newsList = await News.aggregate([
            { $match: { approved: true } },
            { $sample: { size: 15 } },
            { $project: { heading: 1, image: 1, approved: 1, feedId: 1, categories: 1, data: 1, createdAt: 1, keywords: 1 } }
          ]);
        }

        res.status(200).json({"success":true, "data":newsList});
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved news", error: error.message });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        console.log("Finding the ID : ", req.params.id);
        
        const newsItem = await News.find({"feedId":req.params.id, "approved": true })
        if (!newsItem) return res.status(404).json({ message: "News not found" });

        res.json({"success":true, "data":newsItem});
    } catch (error) {
        res.status(500).json({ message: "Error fetching news", error: error.message });
    }
};


exports.getPendingNews = async (req, res) => {
    try {
        const pendingNews = await News.find({ approved: false });
        res.status(200).json({"success":true, "data":pendingNews});
    } catch (error) {
        res.status(500).json({ message: "Error fetching pending news", error: error.message });
    }
};

exports.approveNewsById = async (req, res) => {
    try {
        const articleId = req.params.id;
        const {selectedImageUrl} = req.body;
        console.log("Finding the feedId:", articleId);
        console.log("Getting image:", selectedImageUrl);
        const newsItem =  await News.findOne({ feedId: new ObjectId(articleId) });
        console.log("Got : ", newsItem)
        if (!newsItem) {
            return res.status(404).json({ message: "News not found" });
        }

        if (newsItem.approved) {
            return res.status(200).json({ message: "News already approved", data: newsItem });
        }

        newsItem.approved = true;
        newsItem.image = selectedImageUrl;
        await newsItem.save();

        res.status(200).json({ message: "News approved successfully", data: newsItem });
    } catch (error) {
        console.error("Error approving news:", error);
        res.status(500).json({ message: "Error approving news", error: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const keywords = [
            "Firing", "Murder", "Arrest", "Custody", "Attack", "Violence", "Riot", "Crime",
            "Government", "Policy", "Election", "MP", "MLA", "Parliament", "Bill", "Ministry",
            "Supreme Court", "High Court", "CBI", "NIA", "Judgment", "Petition", "Verdict", "SC",
            "Google", "Microsoft", "OpenAI", "Apple", "AI", "Tech", "Gadget", "Innovation", "Software", "App",
            "Cricket", "IPL", "World Cup", "Olympics", "Football", "Goal", "Wicket", "Player",
            "Stock", "Market", "IPO", "Investment", "Finance", "Shares", "Startup", "Economy", "SREI",
            "Movie", "Bollywood", "Actor", "Actress", "TV", "Netflix", "Cinema", "Music", "OTT", "Theatre",
            "Nagpur", "Delhi", "Mumbai", "Kolkata", "Chennai", "Hyderabad", "Maharashtra", "Tamil Nadu", "Punjab", "Gujarat"
        ];
        res.status(200).json({ success: true, keywords });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch news", details: err.message });
      }
}