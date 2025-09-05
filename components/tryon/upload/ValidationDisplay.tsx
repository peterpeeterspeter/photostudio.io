"use client";

import { useState, useEffect } from "react";

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'passed' | 'failed' | 'warning';
  message?: string;
}

interface ValidationDisplayProps {
  userPhoto?: File | null;
  garmentPhoto?: File | null;
  garmentType?: any;
  onValidationComplete?: (isValid: boolean) => void;
  className?: string;
}

export default function ValidationDisplay({
  userPhoto,
  garmentPhoto,
  garmentType,
  onValidationComplete,
  className = ""
}: ValidationDisplayProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    {
      id: 'user_photo',
      name: 'User Photo',
      description: 'A clear photo of yourself',
      status: 'pending'
    },
    {
      id: 'garment_photo',
      name: 'Garment Photo',
      description: 'A clear photo of the garment',
      status: 'pending'
    },
    {
      id: 'garment_type',
      name: 'Garment Type',
      description: 'Selected garment category',
      status: 'pending'
    },
    {
      id: 'image_quality',
      name: 'Image Quality',
      description: 'Photos meet quality requirements',
      status: 'pending'
    },
    {
      id: 'privacy_consent',
      name: 'Privacy Consent',
      description: 'Agree to privacy terms',
      status: 'pending'
    }
  ]);

  // Simulate validation checks
  useEffect(() => {
    const updateValidation = () => {
      setValidationRules(prev => prev.map(rule => {
        switch (rule.id) {
          case 'user_photo':
            if (!userPhoto) {
              return { ...rule, status: 'pending', message: 'Please upload a photo of yourself' };
            }
            return { ...rule, status: 'passed', message: 'User photo uploaded successfully' };

          case 'garment_photo':
            if (!garmentPhoto) {
              return { ...rule, status: 'pending', message: 'Please upload a garment photo' };
            }
            return { ...rule, status: 'passed', message: 'Garment photo uploaded successfully' };

          case 'garment_type':
            if (!garmentType) {
              return { ...rule, status: 'pending', message: 'Please select a garment type' };
            }
            return { ...rule, status: 'passed', message: `Selected: ${garmentType.name}` };

          case 'image_quality':
            if (!userPhoto || !garmentPhoto) {
              return { ...rule, status: 'pending', message: 'Upload photos to check quality' };
            }
            // Simulate quality check
            const hasGoodQuality = Math.random() > 0.2; // 80% pass rate
            if (hasGoodQuality) {
              return { ...rule, status: 'passed', message: 'Images meet quality standards' };
            } else {
              return { 
                ...rule, 
                status: 'warning', 
                message: 'Images could be clearer. Consider retaking for better results.' 
              };
            }

          case 'privacy_consent':
            // This would be connected to an actual consent checkbox
            return { ...rule, status: 'passed', message: 'Privacy terms accepted' };

          default:
            return rule;
        }
      }));
    };

    updateValidation();
  }, [userPhoto, garmentPhoto, garmentType]);

  // Check if all validations are complete
  useEffect(() => {
    const failedRules = validationRules.filter(rule => rule.status === 'failed');
    const pendingRules = validationRules.filter(rule => rule.status === 'pending' || rule.status === 'checking');
    const isValid = failedRules.length === 0 && pendingRules.length === 0;
    
    onValidationComplete?.(isValid);
  }, [validationRules, onValidationComplete]);

  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'passed':
        return <span className="text-green-500">✓</span>;
      case 'failed':
        return <span className="text-red-500">✗</span>;
      case 'warning':
        return <span className="text-yellow-500">⚠</span>;
      case 'checking':
        return <span className="text-blue-500 animate-spin">⟳</span>;
      case 'pending':
        return <span className="text-gray-400">○</span>;
      default:
        return <span className="text-gray-400">○</span>;
    }
  };

  const getStatusColor = (status: ValidationRule['status']) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'checking':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'pending':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const passedCount = validationRules.filter(rule => rule.status === 'passed').length;
  const totalCount = validationRules.length;
  const progressPercentage = (passedCount / totalCount) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Validation Checklist</h3>
        <div className="text-sm text-gray-600">
          {passedCount} of {totalCount} complete
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Validation Rules */}
      <div className="space-y-3">
        {validationRules.map((rule) => (
          <div
            key={rule.id}
            className={`
              p-3 rounded-lg border transition-all
              ${getStatusColor(rule.status)}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(rule.status)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{rule.name}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
                {rule.message && (
                  <p className="text-xs mt-2 font-medium">{rule.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        {progressPercentage === 100 ? (
          <div className="flex items-center space-x-2 text-green-700">
            <span className="text-green-500">✓</span>
            <p className="text-sm font-medium">Ready to start virtual try-on!</p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-gray-400">○</span>
            <p className="text-sm">Complete all requirements to continue</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">💡 Tip:</span> For best results, use well-lit photos with clear visibility of both yourself and the garment. Avoid busy backgrounds.
        </p>
      </div>
    </div>
  );
}
