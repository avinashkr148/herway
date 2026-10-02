import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { Button, Card, H, Input } from '@/ui/kit';
import { theme } from '@/ui/theme';
import { BillDraft, createMaintenanceRecord, getMaintenanceDashboard, simulateVehicleDrive } from '@/features/maintenance/api';

const suggestedParts = ['Engine oil', 'Oil filter', 'Air filter', 'Brake pads', 'Brake fluid', 'Battery', 'Tyres', 'Chain / belt', 'Spark plug', 'Coolant', 'Lights'];
const today = () => new Date().toISOString().slice(0, 10);
const addMonths = (date: string, months: number) => { const value = new Date(`${date}T12:00:00`); value.setMonth(value.getMonth() + months); return value; };
const dateLabel = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const latestByServiceType = (records: any[]) => Object.values(records.reduce((latest, record) => {
  if (!latest[record.service_type] || latest[record.service_type].service_date < record.service_date) latest[record.service_type] = record;
  return latest;
}, {} as Record<string, any>));

function DueChart({ records, now, odometerKm }: { records: any[]; now: number; odometerKm: number }) {
  const summary = useMemo(() => records.reduce((total, record) => {
    const days = Math.ceil((addMonths(record.service_date, record.interval_months).getTime() - now) / 86400000);
    const kilometres = record.odometer_km != null && record.interval_km != null ? record.odometer_km + record.interval_km - odometerKm : Infinity;
    if (days < 0 || kilometres < 0) total.overdue += 1;
    else if (days <= 30 || kilometres <= 500) total.soon += 1;
    else total.good += 1;
    return total;
  }, { overdue: 0, soon: 0, good: 0 }), [records, now, odometerKm]);
  const total = summary.overdue + summary.soon + summary.good;
  const radius = 42; const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = [{ value: summary.good, color: '#16A34A' }, { value: summary.soon, color: '#D97706' }, { value: summary.overdue, color: theme.danger }];
  return <Card><H>Service due overview</H><View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
    <Svg width={110} height={110} viewBox="0 0 110 110"><Circle cx="55" cy="55" r={radius} stroke={theme.border} strokeWidth="18" fill="none" />
      {total > 0 && segments.map((segment, index) => { const length = circumference * segment.value / total; const circle = <Circle key={index} cx="55" cy="55" r={radius} stroke={segment.color} strokeWidth="18" fill="none" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} rotation="-90" origin="55,55" />; offset += length; return circle; })}
    </Svg><View style={{ flex: 1 }}><Text style={{ color: theme.text, fontWeight: '800' }}>{total ? `${total} recorded service${total === 1 ? '' : 's'}` : 'No services logged'}</Text>
      <Text style={{ color: '#16A34A', marginTop: 4 }}>● {summary.good} on track</Text><Text style={{ color: '#D97706' }}>● {summary.soon} due within 30 days</Text><Text style={{ color: theme.danger }}>● {summary.overdue} overdue</Text>
    </View></View></Card>;
}

export default function Maintenance() {
  const [dashboard, setDashboard] = useState<any>({ vehicle: null, telemetry: null, records: [] });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(0);
  const [serviceDate, setServiceDate] = useState(today()); const [interval, setInterval] = useState('6'); const [odometer, setOdometer] = useState(''); const [intervalKm, setIntervalKm] = useState('5000'); const [demoDrive, setDemoDrive] = useState('100');
  const [serviceType, setServiceType] = useState('Routine service'); const [parts, setParts] = useState<string[]>([]); const [customPart, setCustomPart] = useState('');
  const [cost, setCost] = useState(''); const [notes, setNotes] = useState(''); const [bills, setBills] = useState<BillDraft[]>([]);
  const load = useCallback(async () => { try { const next = await getMaintenanceDashboard(); setDashboard(next); setOdometer((current) => current || (next.telemetry ? String(next.telemetry.odometer_km) : '')); setNow(Date.now()); } catch (error: any) { Alert.alert('Maintenance history', error.message); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const currentServiceRecords = useMemo(() => latestByServiceType(dashboard.records), [dashboard.records]);
  const tripDue = currentServiceRecords.filter((record: any) => addMonths(record.service_date, record.interval_months).getTime() - now <= 30 * 86400000 || (record.odometer_km != null && record.interval_km != null && record.odometer_km + record.interval_km - (dashboard.telemetry?.odometer_km ?? 0) <= 500));
  const togglePart = (part: string) => setParts((current) => current.includes(part) ? current.filter((item) => item !== part) : [...current, part]);
  const addCustomPart = () => { const part = customPart.trim(); if (part && !parts.includes(part)) setParts((current) => [...current, part]); setCustomPart(''); };
  const pickBill = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: true });
    if (result.canceled) return;
    const valid = result.assets.filter((asset) => !asset.size || asset.size <= 10 * 1024 * 1024).map((asset) => ({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream', size: asset.size }));
    if (valid.length !== result.assets.length) Alert.alert('Some files were skipped', 'Each bill must be 10 MB or smaller.');
    setBills((current) => [...current, ...valid].slice(0, 5));
  };
  const save = async () => {
    const intervalMonths = Number(interval); const serviceOdometer = Number(odometer); const distanceInterval = Number(intervalKm); if (!dashboard.vehicle) return Alert.alert('Add a vehicle first', 'Add your vehicle in Profile before creating a maintenance record.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || Number.isNaN(new Date(`${serviceDate}T12:00:00`).getTime())) return Alert.alert('Check service date', 'Use the format YYYY-MM-DD.');
    if (!Number.isInteger(intervalMonths) || intervalMonths < 1 || intervalMonths > 60) return Alert.alert('Check interval', 'Enter a number of months from 1 to 60.');
    if (!Number.isInteger(serviceOdometer) || serviceOdometer < 0 || !Number.isInteger(distanceInterval) || distanceInterval < 1) return Alert.alert('Check kilometre readings', 'Enter whole-number odometer and interval values.');
    setSaving(true); try { await createMaintenanceRecord(dashboard.vehicle.id, { serviceDate, intervalMonths, odometerKm: serviceOdometer, intervalKm: distanceInterval, serviceType, parts, cost: cost ? Number(cost) : undefined, notes, bills }); setServiceDate(today()); setInterval('6'); setOdometer(String(dashboard.telemetry?.odometer_km ?? '')); setIntervalKm('5000'); setServiceType('Routine service'); setParts([]); setCost(''); setNotes(''); setBills([]); await load(); }
    catch (error: any) { Alert.alert('Could not save maintenance', error.message); } finally { setSaving(false); }
  };
  return <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.bg, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(); }} />}>
    <H>Vehicle care</H><Text style={{ color: theme.muted, marginBottom: 6 }}>Private maintenance history, service reminders, and bill records for your vehicle.</Text>
    <Text style={{ color: theme.text, fontWeight: '700' }}>{dashboard.vehicle ? dashboard.vehicle.model || 'Your vehicle' : 'No vehicle added yet'}</Text>
    <Card><H>Demo telemetry</H><Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>{dashboard.telemetry?.odometer_km?.toLocaleString('en-IN') ?? '—'} km</Text><Text style={{ color: theme.muted }}>Simulated vehicle odometer for the demo — not live vehicle data.</Text><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Input placeholder="KM to simulate" keyboardType="number-pad" value={demoDrive} onChangeText={setDemoDrive} style={{ flex: 1 }} /><Pressable onPress={async () => { try { await simulateVehicleDrive(dashboard.vehicle.id, Number(demoDrive)); await load(); } catch (error: any) { Alert.alert('Demo telemetry', error.message); } }} style={{ padding: 12 }}><Text style={{ color: theme.primary, fontWeight: '800' }}>Simulate drive</Text></Pressable></View></Card>
    <DueChart records={currentServiceRecords} now={now} odometerKm={dashboard.telemetry?.odometer_km ?? 0} />
    <Card><H>Long-trip readiness</H>{tripDue.length ? <Text style={{ color: theme.danger, marginBottom: 6 }}>Service attention needed: {tripDue.map((record: any) => record.service_type).join(', ')}.</Text> : <Text style={{ color: '#16A34A', marginBottom: 6 }}>No logged service is due within the next 30 days.</Text>}<Text style={{ color: theme.muted }}>Before leaving, check tyre pressure and tread, brakes, lights, fluids, battery, fuel/charge, and carry the required documents.</Text></Card>
    <Card><H>Log a service</H><Input placeholder="Service date (YYYY-MM-DD)" value={serviceDate} onChangeText={setServiceDate} /><Input placeholder="Odometer at service (km)" keyboardType="number-pad" value={odometer} onChangeText={setOdometer} /><Input placeholder="Service interval in km (e.g. 5000)" keyboardType="number-pad" value={intervalKm} onChangeText={setIntervalKm} /><Input placeholder="Service interval in months (e.g. 6)" keyboardType="number-pad" value={interval} onChangeText={setInterval} /><Input placeholder="Service type (e.g. Routine service)" value={serviceType} onChangeText={setServiceType} />
      <Text style={{ color: theme.text, fontWeight: '700', marginTop: 6 }}>Parts checked or changed</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{suggestedParts.map((part) => <Pressable key={part} onPress={() => togglePart(part)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: parts.includes(part) ? theme.primary : theme.border, backgroundColor: parts.includes(part) ? theme.primary : '#fff' }}><Text style={{ color: parts.includes(part) ? '#fff' : theme.text }}>{part}</Text></Pressable>)}</View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}><Input placeholder="Other part name" value={customPart} onChangeText={setCustomPart} style={{ flex: 1 }} /><Pressable onPress={addCustomPart} style={{ padding: 12 }}><Text style={{ color: theme.primary, fontWeight: '700' }}>Add</Text></Pressable></View>
      {!!parts.filter((part) => !suggestedParts.includes(part)).length && <Text style={{ color: theme.muted }}>Custom: {parts.filter((part) => !suggestedParts.includes(part)).join(', ')}</Text>}
      <Input placeholder="Cost (optional)" keyboardType="decimal-pad" value={cost} onChangeText={setCost} /><Input placeholder="Notes (optional)" multiline value={notes} onChangeText={setNotes} style={{ minHeight: 76, textAlignVertical: 'top' }} />
      <Text style={{ color: theme.text, fontWeight: '700', marginTop: 6 }}>Bills (private, PDF or image)</Text><Text style={{ color: theme.muted }}>Only you can see these attachments. Up to 5 files, 10 MB each.</Text>
      {!!bills.length && bills.map((bill) => <Pressable key={bill.uri} onPress={() => setBills((current) => current.filter((item) => item.uri !== bill.uri))} style={{ paddingVertical: 6 }}><Text style={{ color: theme.primary }}>{bill.name} · Remove</Text></Pressable>)}
      {bills.length < 5 && <Button title="Attach bill" onPress={pickBill} disabled={saving} />}<Button title={saving ? 'Saving…' : 'Save maintenance record'} onPress={save} disabled={saving} />
    </Card>
    <H>History</H>{!dashboard.records.length && !loading && <Card><Text style={{ color: theme.muted }}>Your service history will appear here.</Text></Card>}
    {dashboard.records.map((record: any) => { const due = addMonths(record.service_date, record.interval_months); const days = Math.ceil((due.getTime() - now) / 86400000); const dueKm = record.odometer_km + record.interval_km; const kmRemaining = dueKm - (dashboard.telemetry?.odometer_km ?? 0); const overdue = days < 0 || kmRemaining < 0; const soon = days <= 30 || kmRemaining <= 500; return <Card key={record.id}><Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{record.service_type}</Text><Text style={{ color: theme.muted }}>Done {dateLabel(new Date(`${record.service_date}T12:00:00`))} at {Number(record.odometer_km).toLocaleString('en-IN')} km · every {Number(record.interval_km).toLocaleString('en-IN')} km / {record.interval_months} months</Text><Text style={{ color: overdue ? theme.danger : soon ? '#D97706' : '#16A34A', fontWeight: '700', marginTop: 5 }}>{overdue ? 'Service overdue' : `Next due ${dateLabel(due)} or ${dueKm.toLocaleString('en-IN')} km`}</Text><Text style={{ color: theme.muted }}>{kmRemaining < 0 ? `${Math.abs(kmRemaining).toLocaleString('en-IN')} km overdue` : `${kmRemaining.toLocaleString('en-IN')} km remaining`}</Text>
      {!!record.parts?.length && <Text style={{ color: theme.text, marginTop: 6 }}>Parts: {record.parts.join(', ')}</Text>}{record.cost != null && <Text style={{ color: theme.text }}>Cost: ₹{Number(record.cost).toLocaleString('en-IN')}</Text>}{!!record.notes && <Text style={{ color: theme.muted, marginTop: 5 }}>{record.notes}</Text>}
      {!!record.documents?.length && <View style={{ marginTop: 8 }}>{record.documents.map((document: any) => document.mime_type.startsWith('image/') ? <Pressable key={document.storage_path} onPress={() => document.signedUrl && Linking.openURL(document.signedUrl)}><Image source={{ uri: document.signedUrl }} style={{ width: 96, height: 96, borderRadius: 10, marginRight: 8 }} /></Pressable> : <Pressable key={document.storage_path} onPress={() => document.signedUrl && Linking.openURL(document.signedUrl)} style={{ paddingVertical: 5 }}><Text style={{ color: theme.primary, fontWeight: '700' }}>Open PDF: {document.file_name}</Text></Pressable>)}</View>}
    </Card>; })}
  </ScrollView>;
}
