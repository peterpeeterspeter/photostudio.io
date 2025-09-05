"use client";

import { useState } from "react";
import Image from "next/image";
import BeforeAfter from "./BeforeAfter";
import DownloadButton from "./DownloadButton";

interface TryOnResult {
  id: string;
  originalImageUrl: string;
  resultImageUrl: string;
  garmentName: string;
  garmentType: string;
  fitScore: number;
  sizeRecommendation: string;
  processingTime: number;
  aiProvider: string;
  qualityMetrics: {
    bodyDetectionAccuracy: number;
    garmentMappingScore: number;
    realismScore: number;
  };
  metadata: {
    userId: string;
    createdAt: string;
    expiresAt: string;
  };
}

interface TryOnResultsProps {
  result: TryOnResult;
  onTryAnother?: () => void;
  onShare?: (platform: string) => void;
  className?: string;
}

export default function TryOnResults({
  result,
  onTryAnother,
  onShare,
  className = ""
}: TryOnResultsProps) {
  const [viewMode, setViewMode] = useState<'comparison' | 'result' | 'original'>('comparison');
  const [showMetrics, setShowMetrics] = useState(false);

  const getFitScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getFitScoreText = (score: number) => {
    if (score >= 90) return 'Excellent Fit';
    if (score >= 80) return 'Good Fit';
    if (score >= 70) return 'Fair Fit';
    return 'Poor Fit';
  };

  const formatMetric = (value: number) => Math.round(value * 100);

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Try-On Results</h3>
            <p className="text-sm text-gray-600">{result.garmentName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFitScoreColor(result.fitScore)}`}>
              {getFitScoreText(result.fitScore)}
            </span>
            <span className="text-sm text-gray-500">
              {result.fitScore}%
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'comparison'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Before & After
          </button>
          <button
            onClick={() => setViewMode('result')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'result'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Result Only
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'original'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Original Only
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="px-6 py-6">
        {viewMode === 'comparison' && (
          <BeforeAfter
            beforeImage={result.originalImageUrl}
            afterImage={result.resultImageUrl}
            beforeLabel="Original"
            afterLabel={`With ${result.garmentName}`}
          />
        )}

        {viewMode === 'result' && (
          <div className="text-center">
            <div className="relative aspect-[3/4] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={result.resultImageUrl}
                alt="Virtual try-on result"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">Virtual Try-On Result</p>
          </div>
        )}

        {viewMode === 'original' && (
          <div className="text-center">
            <div className="relative aspect-[3/4] max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={result.originalImageUrl}
                alt="Original photo"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">Original Photo</p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">{result.fitScore}%</p>
            <p className="text-xs text-gray-600">Fit Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{result.sizeRecommendation}</p>
            <p className="text-xs text-gray-600">Recommended Size</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{result.processingTime}s</p>
            <p className="text-xs text-gray-600">Processing Time</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{result.aiProvider}</p>
            <p className="text-xs text-gray-600">AI Provider</p>
          </div>
        </div>
      </div>

      {/* Quality Metrics Toggle */}
      <div className="px-6 py-3 border-t border-gray-200">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">Quality Metrics</span>
          <span className={`transform transition-transform ${showMetrics ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showMetrics && (
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(result.qualityMetrics.bodyDetectionAccuracy)}%
              </div>
              <div className="text-xs text-gray-600">Body Detection</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(result.qualityMetrics.garmentMappingScore)}%
              </div>
              <div className="text-xs text-gray-600">Garment Mapping</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatMetric(result.qualityMetrics.realismScore)}%
              </div>
              <div className="text-xs text-gray-600">Realism Score</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <DownloadButton
            imageUrl={result.resultImageUrl}
            filename={`tryon-result-${result.id}`}
            className="flex-1"
          />
          
          {onTryAnother && (
            <button
              onClick={onTryAnother}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Try Another Garment
            </button>
          )}
        </div>

        {/* Share Options */}
        {onShare && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Share your result:</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => onShare('facebook')}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
              >
                Facebook
              </button>
              <button
                onClick={() => onShare('twitter')}
                className="px-3 py-2 bg-blue-400 text-white rounded text-sm hover:bg-blue-500 transition"
              >
                Twitter
              </button>
              <button
                onClick={() => onShare('instagram')}
                className="px-3 py-2 bg-pink-600 text-white rounded text-sm hover:bg-pink-700 transition"
              >
                Instagram
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Your photos are automatically deleted after 24 hours for privacy protection.
          <br />
          Result expires: {new Date(result.metadata.expiresAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
