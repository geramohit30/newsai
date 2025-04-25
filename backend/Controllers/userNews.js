const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SavedNews = require('../Models/bookmarkModel');
const News = require('../Models/newsModel')

exports.saveNews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newsId } = req.body;

    if (!newsId || !mongoose.Types.ObjectId.isValid(newsId)) {
      return res.status(400).json({ success: false, message: 'Invalid newsId' });
    }

    const existing = await SavedNews.findOne({ user: userId, news: newsId });
    if (existing) {
      return res.status(200).json({ success: true, message: 'News already saved' });
    }

    const savedNews = await SavedNews.create({ user: userId, news: newsId });
    await News.findOneAndUpdate({_id : newsId}, {isSaved : true});
    res.status(201).json({ success: true, message: 'News saved sttccessfully', savedNews });
  } catch (error) {
    console.error('Error saving news:', error);
    res.status(500).json({ success: false, message: 'Failed to save news', error: error.message });
  }
};

exports.unsaveNews = async (req, res) => {
    try {
      const userId = req.user.id;
      const { newsId } = req.body;
      const result = await SavedNews.findOneAndDelete({ user: userId, news: newsId });
      
      if (!result) {  
        return res.status(404).json({ success: false, message: 'News not found in saved articles' });
      }
      await News.findOneAndUpdate({_id : newsId}, {isSaved : false});
  
      res.status(200).json({ success: true, message: 'News unsaved successfully' });
    } catch (error) {
      console.error('Error unsaving news:', error);
      res.status(500).json({ success: false, message: 'Failed to unsave news', error: error.message });
    }
  };

  
  exports.getSavedNews = async (req, res) => {
    try {
      const userId = req.user.id;
      const savedNews = await SavedNews.find({ user: userId }).populate('news','heading image approved feedId categories data createdAt publishedAt keywords isSaved').sort({ savedAt: -1 });
      
      if (savedNews.length === 0) {
        return res.status(404).json({ success: false, message: 'No saved news found' });
      }
  
      res.status(200).json({ success: true, savedNews });
    } catch (error) {
      console.error('Error fetching saved news:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch saved news', error: error.message });
    }
  };
  