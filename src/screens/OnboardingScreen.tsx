import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useStore } from '../store/index';
import {
  ONBOARDING_STYLES,
  ONBOARDING_COLORS,
  ONBOARDING_CATEGORIES,
} from '../engine/taxonomy';

interface OnboardingScreenProps {
  navigation: any;
}

type Step = 'welcome' | 'styles' | 'colors' | 'categories';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const setOnboardingPreferences = useStore(s => s.setOnboardingPreferences);
  const completeOnboarding = useStore(s => s.completeOnboarding);

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleNextStep = () => {
    if (step === 'welcome') {
      setStep('styles');
    } else if (step === 'styles') {
      setStep('colors');
    } else if (step === 'colors') {
      setStep('categories');
    }
  };

  const handleFinish = async () => {
    await setOnboardingPreferences(selectedStyles, selectedColors, selectedCategories);
    await completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'welcome' && (
          <View style={styles.step}>
            <Text style={styles.heading}>Welcome to StyleSwipe</Text>
            <Text style={styles.subtitle}>
              Discover your personal style by swiping. The more you swipe, the better we
              understand your taste.
            </Text>

            <View style={styles.features}>
              <Text style={styles.featureItem}>✨ Personalized recommendations</Text>
              <Text style={styles.featureItem}>💫 Learn from every swipe</Text>
              <Text style={styles.featureItem}>🎯 Find what you love</Text>
            </View>
          </View>
        )}

        {step === 'styles' && (
          <View style={styles.step}>
            <Text style={styles.heading}>What's your style?</Text>
            <Text style={styles.subtitle}>
              Select all that apply (you can change this anytime)
            </Text>

            <View style={styles.options}>
              {ONBOARDING_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.option,
                    selectedStyles.includes(style) && styles.optionSelected,
                  ]}
                  onPress={() => handleStyleToggle(style)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedStyles.includes(style) && styles.optionTextSelected,
                    ]}
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'colors' && (
          <View style={styles.step}>
            <Text style={styles.heading}>What colors do you love?</Text>
            <Text style={styles.subtitle}>Select your color preferences</Text>

            <View style={styles.options}>
              {ONBOARDING_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.option,
                    selectedColors.includes(color) && styles.optionSelected,
                  ]}
                  onPress={() => handleColorToggle(color)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedColors.includes(color) && styles.optionTextSelected,
                    ]}
                  >
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'categories' && (
          <View style={styles.step}>
            <Text style={styles.heading}>What do you like to shop?</Text>
            <Text style={styles.subtitle}>Choose your favorite categories</Text>

            <View style={styles.options}>
              {ONBOARDING_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.option,
                    selectedCategories.includes(category) && styles.optionSelected,
                  ]}
                  onPress={() => handleCategoryToggle(category)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCategories.includes(category) && styles.optionTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>
            {step === 'welcome' ? 'Skip' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, step === 'welcome' && styles.primaryButtonDisabled]}
          onPress={step === 'categories' ? handleFinish : handleNextStep}
          disabled={step === 'welcome'}
        >
          <Text style={styles.primaryButtonText}>
            {step === 'categories' ? 'Start Swiping' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  step: {
    gap: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  features: {
    gap: 8,
    marginTop: 20,
  },
  featureItem: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
