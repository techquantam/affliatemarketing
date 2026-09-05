import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Lock, Mail, User } from 'lucide-react-native';

const normalizeTab = (tab) => {
  if (tab === 'register' || tab === 'join' || tab === 'signup') return 'signup';
  return 'login';
};

export default function AuthModal({ isOpen, onClose, onLogin, theme, initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [isOpen, initialTab]);

  const isDark = theme === 'dark';
  const themeStyles = {
    content: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#1f2937' : '#e5e7eb',
      borderWidth: isDark ? 1 : 0,
    },
    text: {
      color: isDark ? '#f3f4f6' : '#374151',
    },
    textMuted: {
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    input: {
      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
      borderColor: isDark ? '#374151' : '#d1d5db',
    },
    inputField: {
      color: isDark ? '#f3f4f6' : '#111827',
    },
    tabBorder: {
      borderBottomColor: isDark ? '#1f2937' : '#f3f4f6',
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'login') {
      if (!email || !password) return;
      onLogin({
        name: email.split('@')[0],
        email: email,
        wallet: { confirmed: 250.0, pending: 120.0, referral: 75.0 },
      });
    } else {
      if (!name || !email || !password) return;
      onLogin({
        name: name,
        email: email,
        wallet: { confirmed: 0.0, pending: 50.0, referral: 0.0 }, // New signup bonus!
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.content, themeStyles.content]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={isDark ? '#9ca3af' : '#374151'} />
            </TouchableOpacity>

            <View style={[styles.tabs, themeStyles.tabBorder]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'login' && { borderBottomColor: '#ff4f2f', borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('login')}
              >
                <Text style={[styles.tabText, themeStyles.textMuted, activeTab === 'login' && { color: '#ff4f2f', fontWeight: '700' }]}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'signup' && { borderBottomColor: '#ff4f2f', borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('signup')}
              >
                <Text style={[styles.tabText, themeStyles.textMuted, activeTab === 'signup' && { color: '#ff4f2f', fontWeight: '700' }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              {activeTab === 'signup' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, themeStyles.text]}>Full Name</Text>
                  <View style={[styles.inputWrapper, themeStyles.input]}>
                    <User size={16} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, themeStyles.inputField]}
                      placeholder="Enter full name"
                      placeholderTextColor="#9ca3af"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, themeStyles.text]}>Email Address</Text>
                <View style={[styles.inputWrapper, themeStyles.input]}>
                  <Mail size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, themeStyles.inputField]}
                    placeholder="Enter email address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, themeStyles.text]}>Password</Text>
                <View style={[styles.inputWrapper, themeStyles.input]}>
                  <Lock size={16} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, themeStyles.inputField]}
                    placeholder="Enter secure password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#ff4f2f' }]} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>
                  {activeTab === 'login' ? 'Continue & Claim Cashback' : 'Join Now & Get ₹5.00 Bonus'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.footerText, themeStyles.textMuted]}>
                By continuing, you agree to our Terms of Service & Privacy Policy.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '90%',
    maxWidth: 400,
  },
  content: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  submitBtn: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
