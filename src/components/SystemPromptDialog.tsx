import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SystemPromptDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (systemPrompt: string) => void;
  value: string;
  defaultValue: string;
  description: string;
}

export default function SystemPromptDialog({
  visible,
  onClose,
  onSave,
  value,
  defaultValue,
  description,
}: SystemPromptDialogProps) {
  const { theme: currentTheme } = useTheme();
  const themeColors = theme[currentTheme];
  const { width, height } = useWindowDimensions();
  const modalWidth = Math.min(width - 48, 560);
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    if (visible) {
      setCurrentValue(value);
    }
  }, [visible, value]);

  const handleSave = () => {
    onSave(currentValue.trim());
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.background, width: modalWidth, maxHeight: height - 100 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>System Prompt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.description, { color: themeColors.secondaryText }]}>
            {description}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: themeColors.text,
                backgroundColor: themeColors.borderColor + '40',
                borderColor: themeColors.borderColor,
              },
            ]}
            value={currentValue}
            onChangeText={setCurrentValue}
            placeholder="Enter system prompt"
            placeholderTextColor={themeColors.secondaryText}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          <View style={styles.footer}>
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
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  footer: {
    gap: 12,
    marginBottom: 24,
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
  defaultValueContainer: {
    padding: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 12,
    maxHeight: 150,
  },
  defaultValueLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  defaultValueText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 
