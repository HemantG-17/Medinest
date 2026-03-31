const AIKnowledge = require("../models/AIKnowledge");
const UnrecognizedQuery = require("../models/UnrecognizedQuery");

// MediBot Ultra: High-Fidelity NLP Score-Based Matching
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Please describe your symptoms first." });

    const lowerStr = message.toLowerCase();
    
    // 1. Simple Tokenization & Stop-word removal
    const stopwords = ["i", "am", "have", "has", "feel", "feeling", "a", "an", "the", "with", "and", "is", "my", "me"];
    const inputTokens = lowerStr.split(/[\s,?.!]+/).filter(t => t && !stopwords.includes(t));

    // 2. Fetch all knowledge rules
    const allKnowledge = await AIKnowledge.find();
    let bestMatch = null;
    let highestScore = 0;

    for (const item of allKnowledge) {
      let matches = 0;
      
      // Check each keyword against the input message and tokens
      item.keywords.forEach(kw => {
        const cleanKw = kw.toLowerCase().trim();
        // Weighted check: Exact token matches or substring matches
        if (inputTokens.includes(cleanKw) || lowerStr.includes(cleanKw)) {
          matches++;
          // Bonus for exact token match
          if (inputTokens.includes(cleanKw)) matches += 0.5;
        }
      });

      // Calculate Match Density (Confidence)
      // We normalize based on the number of keywords in the rule to avoid "keyword stuffing" bias
      const score = (matches / Math.sqrt(item.keywords.length)) * (matches / Math.sqrt(inputTokens.length || 1));

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    // 3. Return the best match if confidence is sufficient
    // Threshold can be adjusted; 0.4 is generally good for multi-token inputs
    if (bestMatch && highestScore > 0.4) {
      const confidencePercent = Math.min(Math.round(highestScore * 25), 99); // Normalized for UI display
      
      const reply = `🩺 **MediBot Ultra Analysis**\n\n` +
              `I've analyzed your symptoms and found a high correlation with:\n` +
              `**Condition:** ${bestMatch.conditions}\n` +
              `**Confidence:** ${confidencePercent}% Match Density\n\n` +
              `**Recommended Specialist:** ${bestMatch.specialist}\n\n` +
              `**Medical Guidance:**\n${bestMatch.tips}\n\n` +
              `*⚠️ I am an AI, not a doctor. Please visit a clinic for a definitive diagnosis.*`;
      
      return res.json({ reply });
    }

    // 4. Fallback for unknown cases
    await UnrecognizedQuery.create({ message });

    res.json({ 
      reply: `I've analyzed your description carefully, but I can't find a definitive match in my medical database yet.\n\n` +
             `**Next Step:** Consult a **General Physician**. I've logged your symptoms so our medical team can review and teach me about this case.\n\n` +
             `*⚠️ Always seek emergency care if you have severe difficulty breathing or sudden chest pain.*` 
    });

  } catch (err) {
    console.error("AI Ultra Error:", err.message);
    res.status(500).json({ message: "MediBot Ultra is briefly unavailable. Please try again." });
  }
};

// Admin: Get all unrecognized queries
exports.getUnrecognized = async (req, res) => {
  try {
    const queries = await UnrecognizedQuery.find({ isResolved: false }).sort("-createdAt");
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: "Error fetching queries" });
  }
};

// Admin: Teach AI
exports.teachAI = async (req, res) => {
  try {
    const { queryId, keywords, conditions, specialist, tips } = req.body;
    console.log("Teaching AI:", { queryId, keywords, conditions });

    // Validate inputs
    if (!keywords || !keywords.length || !conditions || !specialist) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newKnowledge = await AIKnowledge.create({ keywords, conditions, specialist, tips });
    console.log("Created Knowledge:", newKnowledge._id);

    if (queryId) {
      await UnrecognizedQuery.findByIdAndUpdate(queryId, { isResolved: true });
      console.log("Marked query as resolved:", queryId);
    }

    res.json({ message: "AI has been taught successfully!" });
  } catch (err) {
    console.error("Teach AI Error:", err.message);
    res.status(500).json({ message: "Error teaching AI: " + err.message });
  }
};