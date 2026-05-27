# LootNet Mobile App

This is the Expo mobile app for LootNet. It connects to the LootNet backend API.

## Requirements

- Node.js
- npm
- Expo Go on a phone, or an Android/iOS development environment
- .NET SDK for running the backend
- Access to the LootNet backend repository

## Project Folders

Use the folder where you cloned each repository.

Backend example:

```cmd
cd path\to\LootNet-API
```

Mobile app example:

```cmd
cd path\to\lootnet-mobile
```

## Install Mobile Dependencies

From the mobile app folder:

```cmd
npm install
```

If Expo warns that package versions should be aligned, run:

```cmd
npx expo install
```

## Linting

The project uses Expo ESLint through `eslint-config-expo`.

Linting is enabled in `eslint.config.js` and exposed through the `lint` script in `package.json`:

```cmd
npm run lint
```

To let ESLint apply automatic fixes where possible, run:

```cmd
npm run lint:fix
```

Run `npm run lint` before handing in changes.

## Start The Backend

From the backend API project folder:

```cmd
dotnet run --launch-profile http
```

Leave this terminal open while using the app.

By default, the mobile app expects the backend API to be available at:

```text
http://localhost:5179/api
```

If your backend uses a different address, set:

```cmd
set EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_HOST:PORT/api
```

Then start Expo from the same terminal.

## Start The Mobile App

Open a second terminal in the mobile app folder:

```cmd
npx expo start
```

Scan the QR code with Expo Go.

Only use this command if Android Studio and Android SDK platform tools are installed:

```cmd
npm run android
```

That command requires `adb`.

## Stop The App

In the terminal running Expo or the backend, press:

```text
Ctrl + C
```

If a process is stuck on Windows Command Prompt:

```cmd
taskkill /IM node.exe /F
taskkill /IM "LootNet API.exe" /F
```

If the backend build says a file is locked by a process ID:

```cmd
taskkill /PID PROCESS_ID /F
```

Replace `PROCESS_ID` with the ID shown in the error.

## Update Backend From GitHub

Stop the backend first, then run this from the backend repository folder:

```cmd
git status
git pull
dotnet restore
dotnet build
```

If Git reports dubious ownership, mark the repository as safe:

```cmd
git config --global --add safe.directory "path/to/LootNet-API"
```

Then run:

```cmd
git pull
```

## Login And Register

Start the backend first, then start Expo.

Recommended test flow:

1. Open the app in Expo Go.
2. Create a new account with username, email, and password.
3. Verify the email if the backend requires verification.
4. Log in with email and password.

Seeded backend users may not log in if their stored password is not a real BCrypt password.

## Phone Connection Notes

If using Expo Go on a real phone, the phone and computer must be on the same network.

If the phone cannot reach the backend, set `EXPO_PUBLIC_API_BASE_URL` to your computer network address before starting Expo:

```cmd
set EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:5179/api
npx expo start --host lan
```

If using a USB-connected Android device and Android SDK platform tools are installed:

```cmd
adb reverse tcp:5179 tcp:5179
```

## Quick Restart

Use this when everything feels stuck:

```cmd
taskkill /IM node.exe /F
taskkill /IM "LootNet API.exe" /F
```

Then start the backend again:

```cmd
dotnet run --launch-profile http
```

Then start Expo again from the mobile app folder:

```cmd
npx expo start
```
