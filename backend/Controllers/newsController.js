const News = require('../Models/newsModel');
const SavedNews = require('../Models/bookmarkModel')
const mongoose = require('mongoose');
const firebaseConfig = require('../Config/FirebaseConfig')
const {fetchFirebaseConfig, clearFirebaseConfigCache}  = require('../Config/FirebaseLimitConfig');
const Pagination = require('../Utils/pagination_utils')
const ObjectId = mongoose.Types.ObjectId;

function normalizeCategories(input) {
  if (!input) return [];
  return input
    .split(',')
    .map(cat => cat.trim())
    .filter(Boolean)
    .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
}

exports.getNews = async (req, res) => {
  try {
    const config = await fetchFirebaseConfig();
    const defaultPageSize = parseInt(config.news_limit) || 15;
    const userId = req?.user?.id
    const {
      categories,
      page = 1,
      pageSize = defaultPageSize,
      lang,
    } = req.query;
    const { skip, limit } = Pagination(page, pageSize);
    let savedIdsSet = new Set();
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const saved = await SavedNews.find({ user: userId }).select('news').lean();
      savedIdsSet = new Set(saved.map(s => s.news.toString()));
    }

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
      source: 1,
      sourceUrl: 1,
      gradient: 1,
      isChatGpt: 1,
      images: 1
    };

    const baseMatch = { approved: true };
    if (lang) {
      baseMatch.language = lang.toLowerCase() === 'hi' ? 'hi' : 'en';
    }
    const sort = { publishedAt: -1 };
    let newsList = [];

    if (categories) {
      const categoryArray = normalizeCategories(categories);
      const articlesInRange = await News.find(
        {
          ...baseMatch,
          categories: { $in: categoryArray }
        }
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

      const count = articlesInRange.length;
      if (count > 0) {
        newsList = articlesInRange;
        const remainingCount = pageSize - newsList.length;

        if (remainingCount > 0) {
          const randomArticles = await News.aggregate([
            { $match: { ...baseMatch, categories: { $nin: categoryArray } } },
            { $sample: { size: remainingCount } },
            { $project: projection }
          ]);

          newsList = [...newsList, ...randomArticles];
        }
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    } else {
      newsList = await News.find(baseMatch, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
    }
    const resultWithSaved = newsList.map(article => ({
      ...article,
      isSaved: savedIdsSet.has(article._id.toString())
    }));

    return res.status(200).json({ success: true, data: resultWithSaved });
  } catch (error) {
    console.error("Error fetching approved news:", error);
    res.status(500).json({ message: "Error fetching approved news", error: error.message });
  }
};


exports.getNewsById = async (req, res) => {
  try {
      const is_app = req.query.app;
      if (!is_app) return res.redirect(`/fallback.html?id=${req.params.id}`);

      const userId = req.user ? req.user.id : null;
      let isSaved = false;

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          const savedNews = await SavedNews.findOne({ user: userId, news: req.params.id });
          isSaved = savedNews ? true : false;
      }

      const projection = {
          heading: 1, image: 1, approved: 1, feedId: 1, categories: 1, data: 1,
          createdAt: 1, publishedAt: 1, keywords: 1, source: 1, sourceUrl: 1, gradient: 1, isChatGpt: 1, images: 1
      };

      const newsItem = await News.findOne({ "_id": req.params.id, "approved": true }, projection).lean();
      if (!newsItem) return res.status(404).json({ message: "News not found" });

      const resultWithSaved = { ...newsItem, isSaved };
      res.json({ success: true, data: resultWithSaved });

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
