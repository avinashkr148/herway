import { supabase } from '@/core/supabase';

const BILL_BUCKET = 'vehicle-maintenance-bills';

export type BillDraft = { uri: string; name: string; mimeType: string; size?: number };
export type MaintenanceDraft = {
  serviceDate: string;
  intervalMonths: number;
  odometerKm: number;
  intervalKm: number;
  serviceType: string;
  parts: string[];
  cost?: number;
  notes?: string;
  bills: BillDraft[];
};

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-');

async function uploadBill(userId: string, recordId: string, bill: BillDraft) {
  const response = await fetch(bill.uri);
  if (!response.ok) throw new Error(`Could not read ${bill.name}`);
  const file = await response.arrayBuffer();
  const storagePath = `${userId}/${recordId}/${Date.now()}-${safeFileName(bill.name)}`;
  const { error: uploadError } = await supabase.storage.from(BILL_BUCKET).upload(storagePath, file, { contentType: bill.mimeType, upsert: false });
  if (uploadError) throw uploadError;
  const { error: documentError } = await supabase.from('vehicle_maintenance_documents').insert({
    record_id: recordId, user_id: userId, storage_path: storagePath, file_name: bill.name, mime_type: bill.mimeType,
  });
  if (documentError) {
    await supabase.storage.from(BILL_BUCKET).remove([storagePath]);
    throw documentError;
  }
}

export async function createMaintenanceRecord(vehicleId: string, draft: MaintenanceDraft) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to save maintenance');
  const { data: record, error } = await supabase.from('vehicle_maintenance_records').insert({
    user_id: user.id, vehicle_id: vehicleId, service_date: draft.serviceDate, interval_months: draft.intervalMonths, odometer_km: draft.odometerKm, interval_km: draft.intervalKm,
    service_type: draft.serviceType.trim() || 'Routine service', parts: draft.parts,
    cost: draft.cost, notes: draft.notes?.trim() || null,
  }).select('id').single();
  if (error) throw error;
  await Promise.all(draft.bills.map((bill) => uploadBill(user.id, record.id, bill)));
}

export async function getMaintenanceDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to view maintenance');
  const { data: vehicles, error: vehicleError } = await supabase.from('vehicles').select('id, model').eq('user_id', user.id).order('id').limit(1);
  if (vehicleError) throw vehicleError;
  const vehicle = vehicles[0] ?? null;
  if (!vehicle) return { vehicle: null, telemetry: null, records: [] };
  let { data: telemetry, error: telemetryError } = await supabase.from('vehicle_telemetry').select('odometer_km, source, updated_at').eq('vehicle_id', vehicle.id).maybeSingle();
  if (telemetryError) throw telemetryError;
  if (!telemetry) {
    const { data, error } = await supabase.from('vehicle_telemetry').insert({ vehicle_id: vehicle.id, user_id: user.id, odometer_km: 12480, source: 'demo' }).select('odometer_km, source, updated_at').single();
    if (error) throw error;
    telemetry = data;
  }
  const { data: records, error } = await supabase.from('vehicle_maintenance_records')
    .select('id, service_date, interval_months, odometer_km, interval_km, service_type, parts, cost, notes, created_at')
    .eq('vehicle_id', vehicle.id).order('service_date', { ascending: false });
  if (error) throw error;
  const ids = records.map((record) => record.id);
  if (!ids.length) return { vehicle, telemetry, records: [] };
  const { data: documents, error: documentError } = await supabase.from('vehicle_maintenance_documents')
    .select('record_id, storage_path, file_name, mime_type').in('record_id', ids);
  if (documentError) throw documentError;
  const signedDocuments = await Promise.all(documents.map(async (document) => {
    const { data } = await supabase.storage.from(BILL_BUCKET).createSignedUrl(document.storage_path, 60 * 60);
    return { ...document, signedUrl: data?.signedUrl ?? null };
  }));
  return { vehicle, telemetry, records: records.map((record) => ({ ...record, documents: signedDocuments.filter((document) => document.record_id === record.id && document.signedUrl) })) };
}

export async function simulateVehicleDrive(vehicleId: string, kilometres: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to update demo telemetry');
  if (!Number.isInteger(kilometres) || kilometres < 1 || kilometres > 10000) throw new Error('Enter a whole number between 1 and 10,000 km.');
  const { data: telemetry, error } = await supabase.from('vehicle_telemetry').select('odometer_km').eq('vehicle_id', vehicleId).single();
  if (error) throw error;
  const { error: updateError } = await supabase.from('vehicle_telemetry').update({ odometer_km: telemetry.odometer_km + kilometres, source: 'demo', updated_at: new Date().toISOString() }).eq('vehicle_id', vehicleId).eq('user_id', user.id);
  if (updateError) throw updateError;
}
