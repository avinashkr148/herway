import { supabase } from '@/core/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

export type FeedbackAnswers = {
  roadCondition: number;
  lighting: number;
  womenSafety: number;
  concerns: string[];
  description: string;
};

const PHOTO_BUCKET = 'trip-feedback-images';

function base64ToBytes(base64: string) {
  const binary = globalThis.atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function uploadFeedbackPhoto(userId: string, feedbackId: string, uri: string) {
  // A newly rendered JPEG does not retain the selected image's EXIF/GPS metadata.
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: 1600 });
  const image = await context.renderAsync();
  const output = await image.saveAsync({ compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (!output.base64) throw new Error('Could not prepare the selected photo.');
  const storagePath = `${userId}/${feedbackId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, base64ToBytes(output.base64), { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;
  const { error: rowError } = await supabase.from('trip_feedback_photos').insert({ feedback_id: feedbackId, user_id: userId, storage_path: storagePath });
  if (rowError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    throw rowError;
  }
}

export async function submitTripFeedback(trip: { id: string; destination: string | null }, answers: FeedbackAnswers, photoUris: string[] = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to share feedback');
  const { data: feedback, error } = await supabase.from('trip_feedback').insert({
    trip_id: trip.id, user_id: user.id, destination: trip.destination?.trim() || 'Community route',
    road_condition: answers.roadCondition, lighting: answers.lighting, women_safety: answers.womenSafety,
    concerns: answers.concerns, description: answers.description.trim() || null,
  }).select('id').single();
  if (error) throw error;
  await Promise.all(photoUris.map((uri) => uploadFeedbackPhoto(user.id, feedback.id, uri)));
}

export async function getCommunityFeedback() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('trip_feedback')
    .select('id, user_id, destination, road_condition, lighting, women_safety, concerns, description, created_at')
    .order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  const ids = data.map((feedback) => feedback.id);
  if (!ids.length) return data.map((feedback) => ({ ...feedback, photoUrls: [] as string[], canDelete: feedback.user_id === user?.id }));
  const { data: photos, error: photoError } = await supabase.from('trip_feedback_photos')
    .select('feedback_id, storage_path').in('feedback_id', ids);
  if (photoError) throw photoError;
  const signed = await Promise.all(photos.map(async (photo) => {
    const { data: signedUrl } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path, 60 * 60);
    return { feedbackId: photo.feedback_id, url: signedUrl?.signedUrl };
  }));
  return data.map((feedback) => ({ ...feedback, photoUrls: signed.filter((photo) => photo.feedbackId === feedback.id && photo.url).map((photo) => photo.url as string), canDelete: feedback.user_id === user?.id }));
}

export async function deleteTripFeedback(feedbackId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to delete feedback');

  const { data: photos, error: photoError } = await supabase.from('trip_feedback_photos')
    .select('storage_path').eq('feedback_id', feedbackId).eq('user_id', user.id);
  if (photoError) throw photoError;

  if (photos.length) {
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((photo) => photo.storage_path));
    if (storageError) throw storageError;
  }

  const { error: deleteError } = await supabase.from('trip_feedback').delete().eq('id', feedbackId).eq('user_id', user.id);
  if (deleteError) throw deleteError;
}
