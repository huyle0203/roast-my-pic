"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Header from "./components/Header";
import ProfilePicturePreviews from "./components/ProfilePicturePreviews";

export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'roast' | 'compliment' | 'judging'>('roast');
  const [aiOutput, setAiOutput] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
    }
  };

  const processImages = async (mode: 'roast' | 'compliment' | 'judging') => {
    setIsProcessing(true);
    setMode(mode);
    setAiOutput('');

    const imagePromises = images.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    });

    const imageBase64Strings = await Promise.all(imagePromises);

    const payload = { images: imageBase64Strings, mode };

    try {
      const response = await fetch("/api/process", {
        body: JSON.stringify(payload),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Error generating ${mode}`);

      const data = await response.json();
      setAiOutput(data.text);

      toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} generated successfully!`);

      // Convert base64 to Blob
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: 'audio/mp3'});

      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${mode}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(`Uh oh, it looks like can't generate ${mode}!`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-[#FD297B] to-[#FF655B]">
      <div
        className="bg-white rounded-lg p-6 text-center flex flex-col justify-between"
        style={{ height: "700px", width: "80%" }}
      >
        <Header />

        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mt-4">
            <p className="text-lg text-gray-600">Upload Your Image</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={isProcessing}
            />
          </div>
        </label>

        <ProfilePicturePreviews images={images} />

        <div>
          <button
            onClick={() => void processImages('roast')}
            className="bg-gradient-to-r from-[#FD297B] to-[#FF655B] text-white rounded-md px-4 py-3 text-xl mt-4 disabled:opacity-50 
            duration-200 transform hover:scale-110"
            disabled={isProcessing || images.length === 0}
          >
            {isProcessing && mode === 'roast' ? "Generating Roast..." : "Roast Me"}
          </button>
          <button
            onClick={() => void processImages('compliment')}
            className="bg-gradient-to-r from-[#0079d0] to-[#00ccbb] text-white rounded-md px-4 py-3 text-xl ml-4 disabled:opacity-50
            duration-200 transform hover:scale-110"
            disabled={isProcessing || images.length === 0}
          >
            {isProcessing && mode === 'compliment' ? "Generating Compliment..." : "Compliment Me"}
          </button>
          <button
            onClick={() => void processImages('judging')}
            className="bg-gradient-to-r from-[#d800bf] to-[#ff0090] text-white rounded-md px-4 py-3 text-xl ml-4 disabled:opacity-50
            duration-200 transform hover:scale-110"
            disabled={isProcessing || images.length === 0}
          >
            {isProcessing && mode === 'judging' ? "Generating judges..." : "Judge Me"}
          </button>
          {images.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Need to upload images so I can roast, compliment, or judge you
            </p>
          )}
        </div>

        {/* AI Output Box */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
          <h3 className="text-black text-lg font-semibold mb-2">AI Output:</h3>
          <p className="text-gray-700">{aiOutput || "AI output will appear here..."}</p>
        </div>
      </div>
    </main>
  );
}