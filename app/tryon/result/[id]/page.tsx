"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface TryOnResult {
  id: string;
  originalImage: string;
  resultImage: string;
  garmentName: string;
  garmentType: string;
  fitScore: number;
  sizeRecommendation: string;
  processingTime: number;
  createdAt: string;
}

export default function ResultPage() {
  const params = useParams();
  const [showComparison, setShowComparison] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState("jpg");
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/tryon/result/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch result');
        }
        
        const data = await response.json();
        
        if (data.status === 'completed' && data.result) {
          setResult({
            id: params.id as string,
            originalImage: data.result.originalImageUrl || "/before.jpg",
            resultImage: data.result.resultImageUrl || "/after.jpg",
            garmentName: data.result.garmentName || "Garment",
            garmentType: data.result.garmentType || "clothing",
            fitScore: data.result.qualityMetrics?.overall?.quality * 100 || 85,
            sizeRecommendation: data.result.sizeRecommendation || "Medium",
            processingTime: data.result.processingTime || 30,
            createdAt: data.result.createdAt || new Date().toISOString(),
          });
        } else {
          // Fallback to mock data for demo
          setResult({
            id: params.id as string,
            originalImage: "/before.jpg",
            resultImage: "/after.jpg",
            garmentName: "Classic Blue Denim Jacket",
            garmentType: "jacket",
            fitScore: 92,
            sizeRecommendation: "Medium",
            processingTime: 23,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error fetching result:', err);
        setError("Failed to load results");
        // Fallback to mock data
        setResult({
          id: params.id as string,
          originalImage: "/before.jpg",
          resultImage: "/after.jpg",
          garmentName: "Classic Blue Denim Jacket",
          garmentType: "jacket",
          fitScore: 92,
          sizeRecommendation: "Medium",
          processingTime: 23,
          createdAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || "Results not found"}</p>
          <Link href="/tryon" className="text-indigo-600 hover:underline">
            Return to Try-On Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Virtual Try-On Results
        </h1>
        <p className="text-gray-600">
          Here's how the {result.garmentName} looks on you
        </p>
      </div>

      {/* Results Display */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Image Comparison */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setShowComparison(true)}
              className={`px-4 py-2 rounded-lg transition ${
                showComparison 
                  ? "bg-indigo-600 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Before & After
            </button>
            <button
              onClick={() => setShowComparison(false)}
              className={`px-4 py-2 rounded-lg transition ${
                !showComparison 
                  ? "bg-indigo-600 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Result Only
            </button>
          </div>

          {showComparison ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={result.originalImage}
                    alt="Original photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600">Original</p>
              </div>
              <div className="text-center">
                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={result.resultImage}
                    alt="Virtual try-on result"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600">With {result.garmentName}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative aspect-[3/4] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden mb-2">
                <Image
                  src={result.resultImage}
                  alt="Virtual try-on result"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-600">Virtual Try-On Result</p>
            </div>
          )}
        </div>

        {/* Result Details */}
        <div className="space-y-6">
          {/* Fit Analysis */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Fit Analysis</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Fit Score</span>
                  <span className="text-sm text-gray-600">{result.fitScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${result.fitScore}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {result.fitScore >= 90 ? "Excellent fit!" : 
                   result.fitScore >= 80 ? "Good fit" : 
                   result.fitScore >= 70 ? "Fair fit" : "Consider different size"}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium">Size Recommendation</span>
                <p className="text-lg font-bold text-indigo-600">{result.sizeRecommendation}</p>
                <p className="text-xs text-gray-500">Based on your body measurements</p>
              </div>
            </div>
          </div>

          {/* Garment Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Garment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium">{result.garmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium capitalize">{result.garmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Processing Time:</span>
                <span className="text-sm font-medium">{result.processingTime}s</span>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Download Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="jpg">JPG (Standard)</option>
                  <option value="png">PNG (High Quality)</option>
                  <option value="pdf">PDF (Printable)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                  Download Result
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition text-sm">
                  Download Both
                </button>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Share Your Try-On</h3>
            <div className="grid grid-cols-3 gap-3">
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Facebook
              </button>
              <button className="px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition text-sm">
                Twitter
              </button>
              <button className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm">
                Instagram
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="flex justify-center space-x-4">
          <Link
            href="/tryon/upload"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Try Another Garment
          </Link>
          <Link
            href="/tryon"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition"
          >
            Back to Try-On Home
          </Link>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">How was your virtual try-on experience?</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="text-2xl text-gray-300 hover:text-yellow-400 transition"
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 text-xs text-gray-500">
          <p>
            Your photos are automatically deleted after 24 hours for privacy protection.
            <br />
            Result ID: {result.id} • Generated at {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
