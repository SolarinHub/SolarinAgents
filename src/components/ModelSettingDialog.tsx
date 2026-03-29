import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ModelSettingDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number) => void | Promise<void>;
  label: string;
  value: number;
  defaultValue: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  description: string;
}

export default function ModelSettingDialog({
  visible,
  onClose,
  onSave,
  label,
  value = 0,
  defaultValue = 0,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  description,
}: ModelSettingDialogProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = theme[currentTheme];
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width - 48, 560);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setCurrentValue(value);
    }
  }, [visible, value]);

  const handleSave = () => {
    onSave(currentValue);
    onClose();
  };

  const handleReset = () => {
    setCurrentValue(defaultValue);
  };

  const formatValue = (val: number) => {
    return step >= 1 ? val.toFixed(0) : val.toFixed(2);
  };

  const showResetButton = Math.abs(currentValue - defaultValue) > 0.001;
  const badgeBg = currentTheme === 'dark'
    ? 'rgba(255, 255, 255, 0.15)'
    : themeColors.primary + '15';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background, width: modalWidth }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>{label}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.description, { color: themeColors.secondaryText }]}>
            {description}
          </Text>

          <View style={styles.sliderSection}>
            <View style={[styles.valueBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.valueBadgeText, { color: themeColors.primary }]}>
                {formatValue(currentValue)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={minimumValue}
              maximumValue={maximumValue}
              step={step}
              value={currentValue}
              onValueChange={setCurrentValue}
              minimumTrackTintColor={themeColors.primary}
              thumbTintColor={themeColors.primary}
            />
            <View style={styles.rangeRow}>
              <Text style={[styles.rangeLabel, { color: themeColors.secondaryText }]}>
                {formatValue(minimumValue)}
              </Text>
              <Text style={[styles.rangeLabel, { color: themeColors.secondaryText }]}>
                Default: {formatValue(defaultValue)}
              </Text>
              <Text style={[styles.rangeLabel, { color: themeColors.secondaryText }]}>
                {formatValue(maximumValue)}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            {showResetButton && (
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: themeColors.primary + '20' }]}
                onPress={handleReset}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={themeColors.primary} />
                <Text style={[styles.resetText, { color: themeColors.primary }]}>Reset to Default</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  sliderSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  valueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  valueBadgeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 12,
  },
  footer: {
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
