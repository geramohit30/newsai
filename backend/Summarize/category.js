const categoryKeywords = {
    "Politics": ["election", "minister", "BJP", "Congress", "parliament", "MP", "MLA", "govt", "policy"],
    "Crime": ["violence", "murder", "attack", "arrest", "custody", "firing", "riot", "crime"],
    "Business": ["stock", "finance", "IPO", "market", "investment", "SREI", "economy"],
    "Technology": ["AI", "tech", "OpenAI", "Google", "Microsoft", "app", "gadget"],
    "Sports": ["cricket", "football", "Olympics", "goal", "IPL", "sports"],
    "Entertainment": ["movie", "Bollywood", "actor", "music", "TV", "Netflix", "cinema"],
    "Legal": ["Supreme Court", "CBI", "NIA", "court", "judgment", "petition", "verdict"],
    "Regional": ["Nagpur", "Delhi", "Mumbai", "Kolkata", "Tamil Nadu", "Maharashtra"]
  };
  
  function getCategoriesFromKeywords(keywordsStr) {
    if (!keywordsStr || (Array.isArray(keywordsStr) && keywordsStr.length === 0)) {
      return ["Uncategorized"];
  }

  // Normalize to array of strings
  const keywords = Array.isArray(keywordsStr)
      ? keywordsStr.map(k => k.toLowerCase().trim())
      : keywordsStr.toLowerCase().split(',').map(k => k.trim());

  const matchedCategories = [];
  
    for (const [category, words] of Object.entries(categoryKeywords)) {
      const hasMatch = words.some(word =>
        keywords.some(k => k.includes(word.toLowerCase()))
      );
      if (hasMatch) matchedCategories.push(category);
    }
  
    return matchedCategories.length ? matchedCategories : ["Uncategorized"];
  }
  
  module.exports = getCategoriesFromKeywords ;
  