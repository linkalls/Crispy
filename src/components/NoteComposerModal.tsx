import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ColorScheme, StoredAccount } from '../utils/types';
import { styles } from '../styles/styles';

type AttachedImage = {
  uri: string;
  fileId?: string;
  uploading: boolean;
};

export function NoteComposerModal({
  visible,
  colors,
  activeAccount,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  colors: ColorScheme;
  activeAccount: StoredAccount | null;
  onClose: () => void;
  onSubmit: (text: string, cw: string | null, visibility: string, fileIds: string[]) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [cw, setCw] = useState('');
  const [useCw, setUseCw] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState<AttachedImage[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages: AttachedImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        uploading: false,
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    if (!activeAccount || !activeAccount.token) return null;

    try {
      const formData = new FormData();
      formData.append('i', activeAccount.token);
      
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const hostUrl = activeAccount.host.replace(/\/+$/, '');
      const response = await fetch(`https://${hostUrl}/api/drive/files/create`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      const data = await response.json();
      return data.id;
    } catch (e) {
      console.error('Image upload error:', e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) return;
    setSending(true);

    try {
      // Upload all images
      const fileIds: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, uploading: true } : img))
        );
        const id = await uploadImage(images[i].uri);
        if (id) fileIds.push(id);
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, uploading: false, fileId: id || undefined } : img))
        );
      }

      await onSubmit(text, useCw ? cw : null, visibility, fileIds);
      setText('');
      setCw('');
      setUseCw(false);
      setVisibility('public');
      setImages([]);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const canSubmit = text.trim().length > 0 || images.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={onClose} style={({ pressed }) => [pressed && styles.buttonPressed]}>
              <Text style={{ color: colors.text, fontSize: 16 }}>キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={sending || !canSubmit}
              style={({ pressed }) => [
                { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
                (!canSubmit || sending) && { opacity: 0.5 },
                pressed && styles.buttonPressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Text style={{ color: colors.primaryText, fontWeight: 'bold', fontSize: 15 }}>投稿</Text>
              )}
            </Pressable>
          </View>

          {/* Body */}
          <View style={{ padding: 16, flex: 1 }}>
            {/* Toolbar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable onPress={pickImage} disabled={images.length >= 4} style={({ pressed }) => [pressed && styles.buttonPressed]}>
                  <Ionicons name="image-outline" size={24} color={images.length >= 4 ? colors.border : colors.primary} />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="globe-outline" size={18} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>パブリック</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>CW</Text>
                <Switch value={useCw} onValueChange={setUseCw} />
              </View>
            </View>

            {/* CW input */}
            {useCw && (
              <TextInput
                style={{ color: colors.text, fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8, marginBottom: 12 }}
                placeholder="閲覧注意の警告文"
                placeholderTextColor={colors.textMuted}
                value={cw}
                onChangeText={setCw}
              />
            )}

            {/* Text input */}
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: 18, textAlignVertical: 'top' }}
              placeholder="いまどうしてる？"
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              value={text}
              onChangeText={setText}
            />

            {/* Image previews */}
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {images.map((img, index) => (
                    <View key={index} style={{ position: 'relative', width: 100, height: 100, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                      <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} />
                      {img.uploading && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                          <ActivityIndicator color="#fff" />
                        </View>
                      )}
                      <Pressable
                        onPress={() => removeImage(index)}
                        style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
