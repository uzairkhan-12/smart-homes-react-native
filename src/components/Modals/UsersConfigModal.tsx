import { getColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { deviceStorageService } from '@/src/services/DeviceStorageService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface UserConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSaved: () => void;
  editingUser?: any;
  allowPinChangeForProAdmin?: boolean;
}

interface User {
  id: string;
  name: string;
  pin: string;
  role: 'Admin' | 'User' | 'Pro Admin';
}

const UserConfigModal: React.FC<UserConfigModalProps> = ({ 
  visible, 
  onClose, 
  onUserSaved,
  editingUser,
  allowPinChangeForProAdmin = false
}) => {
  const { theme } = useTheme();
  const systemColorScheme = useColorScheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = getColors(isDarkTheme);

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'Admin' | 'User' | 'Pro Admin'>('User');
  const [isSaving, setIsSaving] = useState(false);

  // Check if the current editing user is the system Pro Admin (non-editable)
  const isEditingProAdmin = editingUser && deviceStorageService.isSystemProAdmin(editingUser.id);

  useEffect(() => {
    if (visible) {
      if (editingUser) {
        // Editing existing user
        setName(editingUser.name);
        setPin(editingUser.pin);
        setRole(editingUser.role);
      } else {
        // Adding new user
        resetForm();
      }
    }
  }, [visible, editingUser]);

  const resetForm = () => {
    setName('');
    setPin('');
    setRole('User');
  };

  const saveUser = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid name.');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'Please enter a valid 6-digit PIN.');
      return;
    }

    // Check for duplicate PIN
    if (editingUser) {
      const isDuplicate = await deviceStorageService.isPinExists(pin, editingUser.id);
      if (isDuplicate) {
        Alert.alert('Duplicate PIN', 'This PIN is already in use by another user.');
        return;
      }
    } else {
      const isDuplicate = await deviceStorageService.isPinExists(pin);
      if (isDuplicate) {
        Alert.alert('Duplicate PIN', 'This PIN is already in use by another user.');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData: Partial<User> = { 
          name: name.trim(), 
          pin,
        };

        // Only allow role update if it's not a Pro Admin or if we're explicitly allowing it
        if (!isEditingProAdmin || allowPinChangeForProAdmin) {
          updateData.role = role;
        }

        await deviceStorageService.updateUser(editingUser.id, updateData);
      } else {
        // Add new user
        const newUser: User = {
          id: Date.now().toString(),
          name: name.trim(),
          pin,
          role,
        };
        await deviceStorageService.addUser(newUser);
      }
      
      Alert.alert(
        'Success', 
        editingUser ? 'User updated successfully!' : 'User added successfully!', 
        [
          { 
            text: 'OK', 
            onPress: () => {
              onUserSaved();
              handleClose();
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Determine if role selection should be disabled
  const isRoleSelectionDisabled = isEditingProAdmin && allowPinChangeForProAdmin;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Field */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter user name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              editable={!isEditingProAdmin || !allowPinChangeForProAdmin}
            />
            {isEditingProAdmin && allowPinChangeForProAdmin && (
              <Text style={[styles.helpText, { color: colors.warning }]}>
                Pro Admin name cannot be changed
              </Text>
            )}

            {/* PIN Field */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>6-Digit PIN</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                },
              ]}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={6}
              placeholder="Enter 6-digit PIN"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Used for authentication. Must be 6 digits.
            </Text>

            {/* Role Selection */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'User' && styles.roleButtonActive,
                  { 
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: role === 'User' ? colors.primary : 'transparent',
                    opacity: isRoleSelectionDisabled ? 0.6 : 1,
                  }
                ]}
                onPress={() => !isRoleSelectionDisabled && setRole('User')}
                disabled={isRoleSelectionDisabled}
              >
                <Text style={[
                  styles.roleButtonText,
                  { color: colors.text },
                  role === 'User' && styles.roleButtonTextActive
                ]}>
                  User
                </Text>
                {role === 'User' && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'Admin' && styles.roleButtonActive,
                  { 
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: role === 'Admin' ? colors.primary : 'transparent',
                    opacity: isRoleSelectionDisabled ? 0.6 : 1,
                  }
                ]}
                onPress={() => !isRoleSelectionDisabled && setRole('Admin')}
                disabled={isRoleSelectionDisabled}
              >
                <Text style={[
                  styles.roleButtonText,
                  { color: colors.text },
                  role === 'Admin' && styles.roleButtonTextActive
                ]}>
                  Admin
                </Text>
                {role === 'Admin' && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Pro Admin Role Option - Only show when adding new user or if not restricted */}
              {/* {(!editingUser || !isRoleSelectionDisabled) && (
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'Pro Admin' && styles.roleButtonActive,
                    { 
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: role === 'Pro Admin' ? colors.warning : 'transparent',
                      opacity: isRoleSelectionDisabled ? 0.6 : 1,
                    }
                  ]}
                  onPress={() => !isRoleSelectionDisabled && setRole('Pro Admin')}
                  disabled={isRoleSelectionDisabled}
                >
                  <Text style={[
                    styles.roleButtonText,
                    { color: colors.text },
                    role === 'Pro Admin' && [styles.roleButtonTextActive, { color: colors.warning }]
                  ]}>
                    Pro Admin
                  </Text>
                  {role === 'Pro Admin' && (
                    <Ionicons name="checkmark" size={16} color={colors.warning} />
                  )}
                </TouchableOpacity>
              )} */}
            </View>
            
            {isRoleSelectionDisabled ? (
              <Text style={[styles.helpText, { color: colors.warning }]}>
                Pro Admin role cannot be changed
              </Text>
            ) : (
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                {role === 'Pro Admin' 
                  ? 'Pro Admin has full access and cannot be deleted or have role changed.'
                  : role === 'Admin' 
                  ? 'Admins have full access to all settings and user management.'
                  : 'Users have limited access to basic features.'
                }
              </Text>
            )}

            {/* Pro Admin Warning */}
            {isEditingProAdmin && allowPinChangeForProAdmin && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  You are editing the system Pro Admin user. Only the PIN can be updated.
                </Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: isSaving ? colors.border : colors.primary 
            }]}
            onPress={saveUser}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : (editingUser ? 'Update User' : 'Save User')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 6,
  },
  formContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    marginTop: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  roleButtonActive: {
    // Color handled inline
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});

export default UserConfigModal;