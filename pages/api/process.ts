import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { images, mode } = req.body;

    if (!images || images.length === 0) {
      res.status(400).json({ message: "No images provided" });
      return;
    }

    if (!mode || !["roast", "compliment", "judging"].includes(mode)) {
      res.status(400).json({ message: "Invalid mode. Use 'roast', 'compliment', or 'judging'" });
      return;
    }

    const openai = new OpenAI();

    const imageMessages: ChatCompletionContentPart[] = images.map(
      (base64Image: string) => ({
        type: "image_url",
        image_url: {
          url: base64Image,
        },
      })
    );

    let promptText: string;

    switch (mode) {
      case "roast":
        promptText = `Concoct a rib-tickling appraisal of an individual's ensemble and aura in their dating profile snapshot.
          Delve beyond mere sartorial selections to the stance they've struck, the ambiance they're basking in,
          and the cohort or objects they've enlisted as accessories. Marinate the narrative in a savory roast comedy marinade,
          seasoned with zesty quips and a dollop of drollery. Celebrate the style misadventures with a nod to their audacious flair,
          whether they're surfing the edge of avant-garde or charmingly clashing. Satirize the gym buffs, globe-trotters, and gastronomy
          aficionados with whimsical analogies that elevate mundane profile props to comedic fame. In crowd shots, weave in a playful 'whodunnit' jest,
          spotlighting the amusing quest to pinpoint the profile's protagonist. Elevate the prose with metaphors and similes that paint the scene as if it's
          a sprightly episode of a fashion critique comedy skit. The roast should emit warmth and merriment, crafting a convivial jeer that tickles the funny
          bone with tender affection, steering clear of the lane of offense. All while speaking plainly, as if to a friend. 
          IMPORTANT: Make sure your response is less than 60 words`;
        break;
    
      case "compliment":
        promptText = `Craft a warm and genuine compliment for the individual's dating profile picture. Focus on their positive attributes,
          style choices, and the overall impression they convey. Highlight their unique features, the setting they've chosen,
          and any interesting elements in the photo. Use creative and uplifting language to boost their confidence and showcase
          their best qualities. Be specific and sincere, avoiding generic praise. Aim to make the person feel appreciated and
          special. Speak as if you're a supportive friend offering heartfelt encouragement. 
          IMPORTANT: Keep your response under 60 words.`;
        break;
    
      case "judging":
        promptText = `
        Provide a playful and slightly sassy critique of the subject's overall appearance in their photos. 

        1. Comment on their outfit choice, pointing out the fine line between stylish and questionable fashion decisions. Offer a light-hearted suggestion for improvement.

        2. Evaluate their pose, highlighting areas where they might look awkward or overly stiff. Suggest ways they could appear more relaxed and confident.

        3. Critique the background of the photos, noting if it seems cluttered or distracting. Offer advice on choosing a more flattering or tidy setting.

        Ensure the critique is a mix of playful judgment and advice, delivered with a humorous, slightly sarcastic tone that encourages users to laugh at themselves while taking the advice to heart.
          IMPORTANT: Limit your response to 60 words or less.`;
        break;
    
      default:
        throw new Error("Invalid mode. Use 'roast', 'compliment', or 'judging'");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      stream: false,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            ...imageMessages,
          ],
        },
      ],
      max_tokens: 300,
    });

    const aiMessage = response.choices[0].message.content;
    console.log("AI Message:", aiMessage);

    if (!aiMessage) {
      return res.status(500).json({ success: false, message: "Failed to generate AI message" });
    }

    // let voice;
    // switch (mode) {
    //   case "roast":
    //     voice = "shimmer";
    //     break;
    //   case "compliment":
    //     voice = "onyx";
    //     break;
    //   case "judging":
    //     voice = "echo";
    //     break;
    //   default:
    //     voice = "shimmer";
    // }

    console.log("Generating audio...");
    const audioMP3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: aiMessage,
      response_format: "mp3",
    });
    console.log("Finished generating audio");

    const audioMP3Buffer = Buffer.from(await audioMP3.arrayBuffer());

    // Convert audio buffer to base64
    const audioBase64 = audioMP3Buffer.toString('base64');

    // Send both text and audio as JSON response
    res.status(200).json({
      success: true,
      text: aiMessage,
      audioBase64: audioBase64
    });

  } catch (error) {
    console.error("Error in generating content:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}