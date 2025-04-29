const News = require('../Models/newsModel');
const mongoose = require('mongoose');
const firebaseConfig = require('../Config/FirebaseConfig')
const {fetchFirebaseConfig, clearFirebaseConfigCache}  = require('../Config/FirebaseLimitConfig');
const ObjectId = mongoose.Types.ObjectId;

exports.getNews = async (req, res) => {
    try {
      const config = await fetchFirebaseConfig();
      const newsLimit = parseInt(config.news_limit) || 15;
  
      const { categories } = req.query;
  
      const projection = {
        heading: 1,
        image: 1,
        approved: 1,
        feedId: 1,
        categories: 1,
        data: 1,
        createdAt: 1,
        publishedAt: 1,
        keywords: 1,
        isSaved: 1,
        source: 1,
        sourceUrl : 1
      };
      const baseMatch = { approved: true };
      let newsList = [];
      if (categories) {
        const categoryArray = categories.split(',').map(cat => cat.trim());
        const matchedNews = await News.find(
          {
            ...baseMatch,
            categories: { $in: categoryArray }
          },
          projection
        )
          .sort({ publishedAt: -1 })
          .limit(newsLimit)
          .lean();
  
        const matchedIds = matchedNews.map(news => news._id);
        const remainingCount = newsLimit - matchedNews.length;
  
        let fillerNews = [];
  
          fillerNews = await News.find(
            {
              ...baseMatch,
              _id: { $nin: matchedIds },
              categories: { $nin: categoryArray }
            },
            projection
          )
            .sort({ publishedAt: -1 })
            .lean();
  
        newsList = [...matchedNews, ...fillerNews];
      } else {
        newsList = await News.find(baseMatch, projection)
          .sort({ publishedAt: -1 })
          .lean();
      }
  
      res.status(200).json({ success: true, data: newsList });
    } catch (error) {
      console.error("Error fetching approved news:", error);
      res.status(500).json({ message: "Error fetching approved news", error: error.message });
    }
  };

exports.getNewsById = async (req, res) => {
    try {
        console.log("Finding the ID : ", req.params.id);
        const projection = {
          heading: 1,
          image: 1,
          approved: 1,
          feedId: 1,
          categories: 1,
          data: 1,
          createdAt: 1,
          publishedAt: 1,
          keywords: 1,
          isSaved: 1,
          source: 1,
          sourceUrl : 1
        };
        const newsItem = await News.find({"_id":req.params.id, "approved": true }, projection );
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
    let default_keyword = [
        "Firing", "Murder", "Arrest", "Custody", "Attack", "Violence", "Riot", "Crime",
        "Government", "Policy", "Election", "MP", "MLA", "Parliament", "Bill", "Ministry",
        "Supreme Court", "High Court", "CBI", "NIA", "Judgment", "Petition", "Verdict", "SC",
        "Google", "Microsoft", "OpenAI", "Apple", "AI", "Tech", "Gadget", "Innovation", "Software", "App",
        "Cricket", "IPL", "World Cup", "Olympics", "Football", "Goal", "Wicket", "Player",
        "Stock", "Market", "IPO", "Investment", "Finance", "Shares", "Startup", "Economy", "SREI",
        "Movie", "Bollywood", "Actor", "Actress", "TV", "Netflix", "Cinema", "Music", "OTT", "Theatre",
        "Nagpur", "Delhi", "Mumbai", "Kolkata", "Chennai", "Hyderabad", "Maharashtra", "Tamil Nadu", "Punjab", "Gujarat"
      ];
    try {
      const config = await fetchFirebaseConfig();
      let keywords = config?.categories || null;
      keywords = JSON.parse(keywords)
      if (!keywords || !Array.isArray(keywords)) {
       keywords = default_keyword
      }
      return res.status(200).json({ success: true, keywords });
      
    } catch (err) {
        keywords = default_keyword
        return res.status(200).json({ success: true, keywords });
    }
  };
  