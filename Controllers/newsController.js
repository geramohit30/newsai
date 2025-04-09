const News = require('../Models/newsModel');
const Headings = require('../Models/headingModel')
exports.getNews = async (req, res) => {
    try {
        const { categories } = req.query;
        let newsList = {};
    
        let query = {};
        if (categories) {
          const categoryArray = categories.split(",").map(cat => cat.trim());
          query = {approved: true , categories: { $in: categoryArray } };
          newsList = await News.find(query).sort({ createdAt: -1 });
        }
        else{ newsList = await News.find({ approved: true });}
        res.status(200).json({"success":true, "data":newsList});
    } catch (error) {
        res.status(500).json({ message: "Error fetching approved news", error: error.message });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        console.log("Finding the ID : ", req.params.id);
        
        const newsItem = await News.find({"article_id":req.params.id, "approved": true })
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