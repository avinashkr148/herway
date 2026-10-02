# HerWay

HerWay is an Expo / React Native app that helps women plan and share trips, find nearby vehicle services, access SOS support, track vehicle maintenance, and share anonymous community road-safety feedback.

## Features

- Phone-number OTP authentication with Supabase Auth
- Live trip sharing and a public tracking link
- Post-trip community reports: road condition, lighting, perceived safety, concerns, description, and optional photos
- Private, metadata-sanitized photo uploads to Supabase Storage
- Nearby fuel, parking, EV charging, and repair searches
- SOS contact alerts
- Vehicle maintenance and telemetry screens
- Runs on the web, Android, and iOS through Expo

## Technology

- Expo SDK 57, React Native 0.86, Expo Router
- Supabase Auth, Postgres, Storage, and Edge Functions
- Expo Location, Task Manager, Image Picker, and Image Manipulator

## Prerequisites

- Node.js **22.13 or newer**
- npm (included with Node)
- A Supabase project
- For Android emulator testing: Android Studio and an Android Virtual Device (AVD)
- For a physical phone: Expo Go or an Expo development build

## First-time setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/avinashkr148/herway.git
cd herway
npm ci
```

When changing dependencies, use Expo's compatibility-aware installer:

```bash
npx expo install <package-name>
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and add your Supabase URL and anon key. Find both in **Supabase Dashboard → Project Settings → API**.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_TRACKER_URL=http://localhost:3000
```

Never commit `.env`. It is ignored by Git.

### 3. Set up Supabase

In Supabase, open **SQL Editor → New query**. Run every file in `supabase/migrations/` in numeric order:

1. `001_auth.sql`
2. `002_sos_trips.sql`
3. `003_trip_feedback.sql`
4. `004_trip_feedback_photos.sql`
5. `005_publish_trip_feedback_photos.sql`
6. `006_delete_own_trip_feedback.sql`
7. `007_vehicle_maintenance.sql`
8. `008_demo_vehicle_telemetry.sql`
9. `009_trip_origin.sql`

These migrations create the tables, RLS policies, private `trip-feedback-images` Storage bucket, and supporting trip/vehicle data.

#### Configure phone OTP

1. Go to **Authentication → Sign In / Providers → Phone** and enable Phone authentication.
2. For development, add test numbers in **Authentication → Providers → Phone → Test Phone Numbers and OTPs**.
3. This app receives a 10-digit Indian mobile number and sends Supabase `+91<mobile>`. Configure test OTPs with the country code and no `+`, for example:

   ```text
   918521727284=123455,919999999999=123456
   ```

4. For production, configure an SMS provider and meet Indian SMS/DLT requirements.

#### Deploy the SOS Edge Function

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase functions deploy send-sos
```

Configure SMS/notification-provider secrets in **Supabase Dashboard → Edge Functions → Secrets**, never in the app `.env`.

## Run the app

### Web

```bash
npx expo start --web
```

Open the URL printed in the terminal, normally `http://localhost:8081`. Use a clean start after dependency, routing, or app-config changes:

```bash
npx expo start -c --web
```

### Physical device with Expo Go

```bash
npx expo start
```

Scan the QR code in Expo Go. Keep the computer and phone on the same network. Native configuration changes may require a development build instead of Expo Go.

### Android Studio emulator

1. Install Android Studio.
2. In **More Actions → Virtual Device Manager**, create and start an Android device.
3. When the emulator has fully booted, run:

   ```bash
   npx expo run:android
   ```

   This generates native Android files when needed, builds, installs, and opens the app in the running emulator.

4. For later runs, after the development build is installed:

   ```bash
   npx expo start --dev-client
   ```

### Android cloud development build

If Android Studio is not installed:

```bash
npx eas-cli@latest build --profile development --platform android
```

Install that build on the device, then run `npx expo start --dev-client`.

## Verify before contributing

```bash
npx tsc --noEmit
npx expo lint
```

## Photo-feedback workflow

1. Complete a trip.
2. In the post-trip survey, select up to three images (10 MB maximum each).
3. The app creates resized JPEG copies before upload, removing original EXIF/GPS metadata.
4. Images are stored in the private Supabase Storage bucket and linked through `trip_feedback_photos`.
5. Community reports display their attached photos.

## Repository conventions

- Routes belong in `app/`; reusable code belongs in `src/`.
- Do not edit generated `android/` or `ios/` directories by hand.
- Add native behavior with `app.json` and config plugins.
- Never commit `.env`, Supabase service-role keys, or SMS-provider credentials.
