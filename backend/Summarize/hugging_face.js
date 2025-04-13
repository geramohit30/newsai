const { HfInference } = require('@huggingface/inference');
const API_KEY = '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';


let inference = new HfInference(API_KEY);

// async function summarizeText(text) {
//     try {
//         const result = await inference.summarization({
//             model: "Mistral-7B",
//             inputs: text,
//         });

//         return result.summary_text; 
//     } catch (error) {
//         console.error("Error summarizing text:", error);
//         return null; 
//     }
// }


async function summarizeText(text) {
    try {
        const result = await inference.request({
            model: "facebook/bart-large-cnn",
            inputs: text
        });

        if (Array.isArray(result) && result.length > 0 && result[0].summary_text) {
            return result[0].summary_text; 
        } else if (typeof result === "string") {
            return result;
        } else if (result.generated_text) {
            return result.generated_text;
        } else {
            throw new Error("Unexpected response format from Hugging Face API");
        }
    } catch (error) {
        console.error("Error summarizing text:", error.message);
        return null;
    }
}


module.exports = summarizeText;