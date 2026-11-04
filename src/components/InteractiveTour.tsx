import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, HelpCircle } from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  targetId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to MicrobiomeXpress',
    description: 'From FASTQ to Insights — in One Click. | One Dashboard. One Click. Complete Workflow.',
    position: 'center',
  },
  {
    title: 'Top Navigation & Cohort Switcher',
    description: 'Switch instantly between pre-loaded microbiome cohorts (Gut Paired-End, Single-End, or Soil Rhizosphere) or click the logo to return to the landing page anytime.',
    targetId: 'tour-header-nav',
    position: 'bottom',
  },
  {
    title: 'Action Hub: Uploads & Parameters',
    description: 'Upload your own FASTQ/FASTA files, configure sample manifests, and fine-tune DADA2 denoising, Phred quality cutoffs, and primer trimming.',
    targetId: 'tour-action-buttons',
    position: 'bottom',
  },
  {
    title: 'Pipeline Execution Stepper',
    description: 'Monitor real-time status across all 7 pipeline stages from Raw QC to SILVA 138.1 taxonomy assignment and diversity metrics.',
    targetId: 'tour-pipeline-stepper',
    position: 'bottom',
  },
  {
    title: 'Analysis Tabs & ASV/OTU Resolution',
    description: 'Explore Overview, FastQC reports, Taxa Bar Plots, Alpha/Beta Diversity PCoA, and toggle between 100% exact ASVs and 97% OTUs.',
    targetId: 'tour-tabs-bar',
    position: 'bottom',
  },
  {
    title: 'Live Analytics & Resource Monitor',
    description: 'Track active sessions, pipeline duration, storage usage, CPU/memory resource allocation, and export telemetry data.',
    targetId: 'tour-analytics-widget',
    position: 'top',
  },
];

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-6 relative overflow-hidden">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Studio Interactive Tour</h3>
              <p className="text-[11px] text-slate-500">Step {currentStepIndex + 1} of {totalSteps}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-3 py-2">
          <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {currentStep.title}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Skip Tour
          </button>
          
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <span>{currentStepIndex === totalSteps - 1 ? 'Finish Tour' : 'Next Step'}</span>
              {currentStepIndex < totalSteps - 1 && <ArrowRight className="w-3.5 h-3.5" />}
              {currentStepIndex === totalSteps - 1 && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
