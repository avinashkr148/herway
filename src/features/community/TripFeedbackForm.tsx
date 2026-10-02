import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, H, Input } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { FeedbackAnswers } from './api';

const choices = [
  { key: 'roadCondition', label: 'How was the road?', values: ['Poor', 'Okay', 'Good'] },
  { key: 'lighting', label: 'How was the street lighting?', values: ['Poor', 'Partial', 'Well lit'] },
  { key: 'womenSafety', label: 'Did you feel safe driving here?', values: ['No', 'Somewhat', 'Yes'] },
] as const;
const concernOptions = ['Low lighting', 'Poor road', 'Traffic', 'Isolated area', 'Harassment', 'Other'];

export default function TripFeedbackForm({ destination, onSubmit, onSkip }: { destination: string | null; onSubmit: (answers: FeedbackAnswers, photoUris: string[]) => Promise<void>; onSkip: () => void }) {
  const [roadCondition, setRoadCondition] = useState(2);
  const [lighting, setLighting] = useState(2);
  const [womenSafety, setWomenSafety] = useState(2);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const values = { roadCondition, lighting, womenSafety };
  const setters = { roadCondition: setRoadCondition, lighting: setLighting, womenSafety: setWomenSafety };
  const submit = async () => {
    setSaving(true);
    try { await onSubmit({ ...values, concerns, description }, photoUris); }
    catch (error: any) { Alert.alert('Could not save feedback', error.message); }
    finally { setSaving(false); }
  };
  const choosePhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission required', 'Allow photo access to attach images to your feedback.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 3 - photoUris.length, quality: 1 });
    if (result.canceled) return;
    const accepted = result.assets.filter((asset) => !asset.fileSize || asset.fileSize <= 10 * 1024 * 1024).map((asset) => asset.uri);
    if (accepted.length !== result.assets.length) Alert.alert('Some photos were skipped', 'Each selected photo must be 10 MB or smaller.');
    setPhotoUris((current) => [...current, ...accepted].slice(0, 3));
  };
  return <Card>
    <H>How was your trip?</H>
    <Text style={{ color: theme.muted, marginBottom: 12 }}>Help other women travel more confidently{destination ? ` to ${destination}` : ''}. Your name and live location are never shared.</Text>
    {choices.map(({ key, label, values: labels }) => <View key={key} style={{ marginBottom: 12 }}>
      <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>{labels.map((option, index) => <Pressable key={option} onPress={() => setters[key](index + 1)} style={{ flex: 1, padding: 9, borderRadius: 10, borderWidth: 1, borderColor: values[key] === index + 1 ? theme.primary : theme.border, backgroundColor: values[key] === index + 1 ? theme.primary : '#fff' }}><Text style={{ textAlign: 'center', color: values[key] === index + 1 ? '#fff' : theme.text }}>{option}</Text></Pressable>)}</View>
    </View>)}
    <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 6 }}>What did you notice?</Text>
    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{concernOptions.map((concern) => <Pressable key={concern} onPress={() => setConcerns((current) => current.includes(concern) ? current.filter((item) => item !== concern) : [...current, concern])} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 18, borderWidth: 1, borderColor: concerns.includes(concern) ? theme.primary : theme.border, backgroundColor: concerns.includes(concern) ? theme.primary : '#fff' }}><Text style={{ color: concerns.includes(concern) ? '#fff' : theme.text }}>{concern}</Text></Pressable>)}</View>
    <Input placeholder="Add any helpful details (optional)" multiline maxLength={600} value={description} onChangeText={setDescription} style={{ minHeight: 82, textAlignVertical: 'top' }} />
    <Text style={{ color: theme.text, fontWeight: '700', marginTop: 8 }}>Photos (optional, up to 3)</Text>
    <Text style={{ color: theme.muted, marginTop: 2 }}>We remove location metadata before upload. Attached photos are shared with the community.</Text>
    {!!photoUris.length && <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{photoUris.map((uri) => <Pressable key={uri} onPress={() => setPhotoUris((current) => current.filter((photo) => photo !== uri))}><Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10 }} /><Text style={{ color: theme.primary, textAlign: 'center' }}>Remove</Text></Pressable>)}</View>}
    {photoUris.length < 3 && <Button title={`Add photo${photoUris.length ? ` (${photoUris.length}/3)` : ''}`} onPress={choosePhotos} disabled={saving} />}
    <Button title={saving ? 'Posting feedback…' : 'Post to community'} onPress={submit} disabled={saving} />
    <Pressable onPress={onSkip} disabled={saving} style={{ padding: 10 }}><Text style={{ color: theme.primary, textAlign: 'center', fontWeight: '700' }}>Skip for now</Text></Pressable>
  </Card>;
}
