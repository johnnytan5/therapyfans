"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VibeTag } from "./VibeTag";
import { ClientPreferences } from "@/lib/aiMatchmaking";
import { 
  Heart, 
  Languages, 
  Target, 
  Smile, 
  Clock, 
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle,
  MessageCircle,
  User
} from "lucide-react";

interface ClientPreferencesFormProps {
  onPreferencesSubmit: (preferences: ClientPreferences) => void;
  loading?: boolean;
}

// Available vibe tags for selection
const availableVibeTags = [
  "Calm", "Direct", "Empathetic", "Structured", "Flexible", 
  "Spiritual", "Practical", "Warm", "Professional", "Casual"
];

// Available languages
const availableLanguages = [
  "English", "Spanish", "Mandarin", "Arabic", "French", 
  "German", "Portuguese", "Russian", "Japanese", "Korean"
];

// Common therapy goals
const therapyGoals = [
  "Anxiety Management", "Depression Support", "Stress Relief", 
  "Relationship Issues", "Trauma Recovery", "Self-Esteem", 
  "Life Transitions", "Grief & Loss", "Addiction Recovery",
  "Work-Life Balance", "Personal Growth", "Coping Skills"
];

// Mood options with emojis
const moodOptions = [
  { emoji: "😊", label: "Hopeful", value: "hopeful" },
  { emoji: "😔", label: "Sad", value: "sad" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
  { emoji: "😤", label: "Stressed", value: "stressed" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😡", label: "Angry", value: "angry" },
  { emoji: "🤔", label: "Confused", value: "confused" }
];

// Step configuration
const steps = [
  { id: 1, title: "How are you feeling?", icon: Smile, color: "text-yellow-400" },
  { id: 2, title: "What's your therapy vibe?", icon: Heart, color: "text-red-400" },
  { id: 3, title: "What are your goals?", icon: Target, color: "text-green-400" },
  { id: 4, title: "Language preferences", icon: Languages, color: "text-blue-400" },
  { id: 5, title: "Session details", icon: Clock, color: "text-purple-400" }
];

export function ClientPreferencesForm({ onPreferencesSubmit, loading = false }: ClientPreferencesFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [sessionLength, setSessionLength] = useState<number>(45);
  const [budget, setBudget] = useState<number>(150);

  const toggleVibeTag = (tag: string) => {
    setSelectedVibeTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const preferences: ClientPreferences = {
      vibeTags: selectedVibeTags,
      preferredLanguages: selectedLanguages,
      therapyGoals: selectedGoals,
      mood: selectedMood,
      sessionLength,
      budget
    };

    onPreferencesSubmit(preferences);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedMood !== "";
      case 2: return selectedVibeTags.length > 0;
      case 3: return selectedGoals.length > 0;
      case 4: return selectedLanguages.length > 0;
      case 5: return true; // Session details are optional
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smile className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">How are you feeling today?</h3>
              <p className="text-muted-foreground">This helps us understand your current emotional state</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {moodOptions.map(mood => (
                <Button
                  key={mood.value}
                  variant={selectedMood === mood.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMood(mood.value)}
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:scale-105 transition-transform"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">What's your preferred therapy vibe?</h3>
              <p className="text-muted-foreground">Choose the communication style that feels most comfortable</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {availableVibeTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedVibeTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-all duration-200 text-sm px-4 py-2"
                  onClick={() => toggleVibeTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectedVibeTags.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Selected: {selectedVibeTags.join(", ")}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">What are your therapy goals?</h3>
              <p className="text-muted-foreground">What would you like to work on or improve?</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {therapyGoals.map(goal => (
                <Badge
                  key={goal}
                  variant={selectedGoals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-all duration-200 text-sm px-4 py-2"
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Badge>
              ))}
            </div>
            {selectedGoals.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Selected: {selectedGoals.join(", ")}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">What languages do you prefer?</h3>
              <p className="text-muted-foreground">Choose the languages you're most comfortable with</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {availableLanguages.map(language => (
                <Badge
                  key={language}
                  variant={selectedLanguages.includes(language) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-all duration-200 text-sm px-4 py-2"
                  onClick={() => toggleLanguage(language)}
                >
                  {language}
                </Badge>
              ))}
            </div>
            {selectedLanguages.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Selected: {selectedLanguages.join(", ")}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Session preferences</h3>
              <p className="text-muted-foreground">Optional: Set your preferred session length and budget</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Session length (minutes)</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={sessionLength}
                    onChange={(e) => setSessionLength(Number(e.target.value))}
                    min="15"
                    max="120"
                    step="15"
                    className="w-24"
                  />
                  <span className="text-muted-foreground">minutes</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Budget per session (SUI)</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    min="5"
                    max="500"
                    step="5"
                    className="w-24"
                  />
                  <span className="text-muted-foreground">SUI</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass border-glow">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageCircle className="w-6 h-6 text-purple-400" />
          <CardTitle className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Let's find your perfect match
          </CardTitle>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                currentStep >= step.id 
                  ? 'bg-purple-500 border-purple-500 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                  currentStep > step.id ? 'bg-purple-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding your perfect match...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Find My Match
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="text-center">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
