"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [uploadStep, setUploadStep] = useState<"photo" | "garment" | "options">("photo");
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [garmentPhoto, setGarmentPhoto] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (garmentType: string, fitPreference: string) => {
    if (!userPhoto || !garmentPhoto) {
      alert("Please upload both photos before proceeding.");
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Starting virtual try-on submission...");

      // Upload user image first
      const userFormData = new FormData();
      userFormData.append('file', userPhoto);
      userFormData.append('type', 'person');
      userFormData.append('garmentType', garmentType);

      const userUploadResponse = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: userFormData,
      });

      if (!userUploadResponse.ok) {
        const errorText = await userUploadResponse.text();
        throw new Error(`User image upload failed: ${errorText}`);
      }

      const userUploadResult = await userUploadResponse.json();
      console.log("User image uploaded:", userUploadResult);

      // Upload garment image
      const garmentFormData = new FormData();
      garmentFormData.append('file', garmentPhoto);
      garmentFormData.append('type', 'garment');
      garmentFormData.append('garmentType', garmentType);

      const garmentUploadResponse = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: garmentFormData,
      });

      if (!garmentUploadResponse.ok) {
        const errorText = await garmentUploadResponse.text();
        throw new Error(`Garment image upload failed: ${errorText}`);
      }

      const garmentUploadResult = await garmentUploadResponse.json();
      console.log("Garment image uploaded:", garmentUploadResult);

      // Start processing with the uploaded file URLs
      const processResponse = await fetch('/api/tryon/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userImageUrl: userUploadResult.previewUrl,
          garmentImageUrl: garmentUploadResult.previewUrl,
          garmentType,
          options: {
            fitPreference,
            quality: 'high'
          }
        }),
      });

      if (!processResponse.ok) {
        throw new Error(`Processing failed: ${processResponse.statusText}`);
      }

      const processResult = await processResponse.json();
      console.log("Processing started:", processResult);

      // Redirect to processing page
      router.push(`/tryon/processing/${processResult.jobId}`);

    } catch (error) {
      console.error("Try-on submission failed:", error);
      alert("Failed to start virtual try-on. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <StepIndicator step={1} currentStep={uploadStep === "photo" ? 1 : uploadStep === "garment" ? 2 : 3} label="Upload Photo" />
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <StepIndicator step={2} currentStep={uploadStep === "photo" ? 1 : uploadStep === "garment" ? 2 : 3} label="Select Garment" />
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <StepIndicator step={3} currentStep={uploadStep === "photo" ? 1 : uploadStep === "garment" ? 2 : 3} label="Configure Options" />
        </div>
      </div>

      {/* Upload Steps */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {uploadStep === "photo" && (
          <PhotoUploadStep 
            userPhoto={userPhoto}
            setUserPhoto={setUserPhoto}
            onNext={() => setUploadStep("garment")}
          />
        )}

        {uploadStep === "garment" && (
          <GarmentUploadStep 
            garmentPhoto={garmentPhoto}
            setGarmentPhoto={setGarmentPhoto}
            onNext={() => setUploadStep("options")}
            onBack={() => setUploadStep("photo")}
          />
        )}

        {uploadStep === "options" && (
          <OptionsStep 
            onBack={() => setUploadStep("garment")}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tips for Best Results</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Use a clear, well-lit photo of yourself</li>
          <li>• Stand in a neutral pose with arms at your sides</li>
          <li>• Ensure the garment image shows the full item clearly</li>
          <li>• Avoid busy backgrounds in both photos</li>
        </ul>
      </div>
    </div>
  );
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
        isCompleted 
          ? "bg-green-500 text-white" 
          : isActive 
            ? "bg-indigo-600 text-white" 
            : "bg-gray-300 text-gray-600"
      }`}>
        {isCompleted ? "✓" : step}
      </div>
      <span className={`mt-2 text-sm ${isActive ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );
}

function PhotoUploadStep({ 
  userPhoto, 
  setUserPhoto, 
  onNext 
}: { 
  userPhoto: File | null; 
  setUserPhoto: (file: File | null) => void; 
  onNext: () => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserPhoto(e.target.files[0]);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Upload Your Photo</h2>
      <p className="text-gray-600 mb-8">
        Upload a clear photo of yourself to get started with virtual try-on.
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="user-photo-upload"
        />
        <label
          htmlFor="user-photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="text-4xl mb-4">📷</div>
          <div className="text-lg font-semibold mb-2">
            {userPhoto ? userPhoto.name : "Click to upload or drag and drop"}
          </div>
          <div className="text-gray-500">
            PNG, JPG up to 10MB
          </div>
        </label>
      </div>

      <button
        onClick={onNext}
        disabled={!userPhoto}
        className={`px-6 py-3 rounded-lg font-semibold transition ${
          userPhoto
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Next: Select Garment
      </button>
    </div>
  );
}

function GarmentUploadStep({ 
  garmentPhoto, 
  setGarmentPhoto, 
  onNext, 
  onBack 
}: { 
  garmentPhoto: File | null; 
  setGarmentPhoto: (file: File | null) => void; 
  onNext: () => void;
  onBack: () => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGarmentPhoto(e.target.files[0]);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Select Garment</h2>
      <p className="text-gray-600 mb-8">
        Upload an image of the garment you want to try on virtually.
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="garment-photo-upload"
        />
        <label
          htmlFor="garment-photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="text-4xl mb-4">👕</div>
          <div className="text-lg font-semibold mb-2">
            {garmentPhoto ? garmentPhoto.name : "Click to upload garment image"}
          </div>
          <div className="text-gray-500">
            PNG, JPG up to 10MB
          </div>
        </label>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!garmentPhoto}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            garmentPhoto
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next: Configure Options
        </button>
      </div>
    </div>
  );
}

function OptionsStep({ 
  onBack, 
  onSubmit,
  isProcessing 
}: { 
  onBack: () => void;
  onSubmit: (garmentType: string, fitPreference: string) => void;
  isProcessing?: boolean;
}) {
  const [garmentType, setGarmentType] = useState("top");
  const [fitPreference, setFitPreference] = useState("regular");

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Configure Try-On Options</h2>
      <p className="text-gray-600 mb-8">
        Set your preferences for the best virtual try-on experience.
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Garment Type
          </label>
          <select
            value={garmentType}
            onChange={(e) => setGarmentType(e.target.value)}
            className="w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="top">Top / Shirt</option>
            <option value="dress">Dress</option>
            <option value="pants">Pants / Trousers</option>
            <option value="jacket">Jacket / Blazer</option>
            <option value="hoodie">Hoodie</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fit Preference
          </label>
          <select
            value={fitPreference}
            onChange={(e) => setFitPreference(e.target.value)}
            className="w-full max-w-xs mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="tight">Tight Fit</option>
            <option value="regular">Regular Fit</option>
            <option value="loose">Loose Fit</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:border-gray-400 transition"
        >
          Back
        </button>
        <button
          onClick={() => onSubmit(garmentType, fitPreference)}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            isProcessing
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            "Start Virtual Try-On"
          )}
        </button>
      </div>
    </div>
  );
}
