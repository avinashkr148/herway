// OPTIONAL: server-side SOS SMS via Twilio. Deploy: supabase functions deploy send-sos
// Secrets: TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { lat, lng } = await req.json();
  const { data: contacts } = await supabase.from('contacts').select('phone');
  const body = `SOS! Help needed. Location: https://maps.google.com/?q=${lat},${lng}`;
  const sid = Deno.env.get('TWILIO_SID')!, tok = Deno.env.get('TWILIO_TOKEN')!;

  const results = await Promise.all((contacts ?? []).map(async (c) => {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${sid}:${tok}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: c.phone, From: Deno.env.get('TWILIO_FROM')!, Body: body }),
    });
    if (!response.ok) throw new Error(`SMS provider rejected a message: ${await response.text()}`);
    return response;
  }));
  if (results.length !== (contacts ?? []).length) return new Response('Could not send all SOS messages', { status: 502 });
  return Response.json({ sent: contacts?.length ?? 0 });
});
