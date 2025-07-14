const { cat } = require("stopword");

const categoryKeywords = {
  "Technology": ["ai", "tech", "openai", "google", "microsoft", "app", "gadget", "innovation", "robotics", "software", "hardware"],
  "Sports": ["cricket", "football", "olympics", "goal", "ipl", "sports", "athletes", "stadium", "soccer", "basketball"],
  "Entertainment": ["movie", "bollywood", "actor", "music", "tv", "netflix", "cinema", "celebrity", "hollywood", "show", "series", "idol"],
  "National News": ["india", "nation", "national", "government", "prime minister", "india today", "policy", "news", "nationwide", "minister", "public policy"],
  "World News": ["world", "international", "global", "united nations", "foreign", "countries", "international relations", "climate change", "global news", "foreign affairs"],
  "Politics": ["election", "minister", "bjp", "congress", "parliament", "mp", "mla", "govt", "policy", "party", "vote", "democracy", "president"],
  "Business": ["stock", "finance", "ipo", "market", "investment", "economy", "company", "corporate", "business news", "finance market", "startup", "entrepreneurship"],
  "Health": ["health", "medicine", "hospital", "doctor", "patient", "care", "wellness", "treatment", "covid", "mental health", "fitness", "nutrition", "doctor's advice"],
  "Lifestyle": ["fashion", "beauty", "travel", "food", "fitness", "culture", "style", "relationships", "mindfulness", "home decor", "well-being"]
};
function getCategoriesFromKeywords(keywordsStr, headingStr) {
  try{
    if (!keywordsStr && !headingStr) {
      return ["Uncategorized"];
    }

    // Normalize to array of strings for keywords
    const keywords = Array.isArray(keywordsStr)
        ? keywordsStr.map(k => k.toLowerCase().trim())
        : keywordsStr.toLowerCase().split(',').map(k => k.trim());

    const heading = headingStr ? headingStr.toLowerCase().trim() : "";
    const matchedCategories = [];

    for (const [category, words] of Object.entries(categoryKeywords)) {
      const hasKeywordMatch = words.some(word => 
        keywords.some(k => k.includes(word))
      );
      const hasHeadingMatch = words.some(word => 
        heading.includes(word)
      );
      if (hasKeywordMatch || hasHeadingMatch) {
        matchedCategories.push(category);
      }
    }

    return matchedCategories.length ? matchedCategories : ["Uncategorized"];
  }
  catch (error) {
    console.error("Error in getCategoriesFromKeywords:", error.message);
    return ["Uncategorized"];
  }
}

module.exports = getCategoriesFromKeywords;
