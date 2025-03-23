# World ID Voting App

Welcome! 🎉

This repository provides a secure voting application built with [World's Mini Apps](https://docs.world.org/mini-apps) technology. The app uses World ID verification to ensure only eligible users can create polls and vote.

The application is built with **Next.js** and showcases various [commands](https://docs.world.org/mini-apps/quick-start/commands) supported by the MiniKit SDK, focused on creating a user-friendly and secure voting experience.

## 🚀 Latest Updates

We've fixed several issues in the voting application:

1. **Vote Misattribution Fixed**: Each vote now includes a `voterId` field that stores the user's World ID unique identifier (`worldHumanId`), ensuring votes are correctly tracked per device
2. **Login Enforcement Added**: The app now checks for a valid MiniKit session on each load and prompts for login when needed
3. **Vote Verification Improved**: Votes are now verified against the current user's World ID, fixing the issue where votes from one device appeared on another
4. **Data Model Updated**: The `User` interface now includes a `worldHumanId` field, and the system prioritizes this identifier over wallet addresses
5. **Poll Creation Enhanced**: Poll creation now uses the creator's World ID as the `creatorId`
6. **Previous Fixes**: Login flow improvements, dropdown menus, infinite loop bugs, mock data, and mobile UI enhancements

Let's dive in!

---

## Features

- **World ID Authentication**: Secure login using World ID verification
- **Poll Creation**: Create public or private polls with customizable settings
- **Verification Levels**: Support for different verification levels (Orb, Device, None)
- **Voting**: Vote on polls with single or multiple choice options
- **Results Visualization**: View real-time poll results with statistics
- **Privacy Options**: Anonymous voting to protect voter identity when needed

---

## Dependencies

- **[pnpm](https://pnpm.io/)**: Fast and efficient package manager.
- **[ngrok](https://ngrok.com/)**: Expose your local server publicly for easy testing.
- **[mini-kit-js](https://www.npmjs.com/package/@worldcoin/mini-kit-js)**: JavaScript SDK for World's Mini Apps.
- **[mini-apps-ui-kit-react](https://www.npmjs.com/package/@worldcoin/mini-apps-ui-kit-react)**: Pre-built UI components for Mini Apps.
- **[next-auth](https://www.npmjs.com/package/next-auth)**: Authentication for Next.js
- **[tailwindcss](https://tailwindcss.com/)**: Utility-first CSS framework for styling

---

## 🛠️ Setup

### 1. Clone the repository

```bash
git clone git@github.com:MzzuMrz/wld-mini-app.git
cd wld-mini-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure your environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then fill in the required variables:

#### 🔑 APP_ID

Find your **App ID** in the [Developer Portal](https://developer.worldcoin.org/) (`Configuration > Basic`).

#### 🔑 DEV_PORTAL_API_KEY

Generate your **API Key** under the `API Keys` section.  
**Note:** Visible only once—copy it carefully!

#### 🔑 JWT_SECRET

Add a strong, random string as your JWT secret for secure user sessions:

JWT_SECRET=your_secure_random_string_at_least_32_chars_long

This secret is used to:
- Sign and verify JWT tokens for user authentication
- Maintain persistent login sessions across page refreshes
- Securely store user information between visits

**Security Tips:**
- Use a cryptographically strong random string (at least 32 characters)
- Never expose this secret in client-side code
- Consider rotating this secret periodically for enhanced security

Without a properly configured `JWT_SECRET`, the authentication system will not work correctly, and users will need to log in each time they visit your Mini App.

---

## ▶️ Running the Project

Run your voting app locally:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Testing on Mobile

To test your voting app directly on your phone, expose your app publicly using NGROK.

### 🚀 Using NGROK

Install [NGROK](https://ngrok.com/) and run:

```bash
ngrok http http://localhost:3000
```

NGROK provides a publicly accessible URL.

### 🌎 Configuring Your App (Developer Portal)

Go to the [Developer Portal](https://developer.worldcoin.org/) and configure:

- **App URL:** Set it to your NGROK-generated URL.

### 📱 Opening your Voting App in World App

From the [Developer Portal](https://developer.worldcoin.org/), navigate to `Configuration > Basic` and scan the generated QR code.

The World App will automatically launch your voting app! 🎉

---

## 🔍 Using the Voting App

### 1. Login with World ID
First, you need to authenticate using World ID to access the app's features. The app will immediately show the main menu once you're authenticated.

### 2. Create a Poll
After logging in, you can create a new poll with:
- Poll title/question (max 100 characters)
- 2-5 voting options
- Verification level (orb, device, none)
- Public or private poll visibility
- End time (date or duration)
- Anonymous voting option
- Single or multi-choice selection option

### 3. Vote on Polls
- View a list of available public polls filtered by your verification level
- Join private polls using a passcode
- Cast your vote according to the poll's choice type

### 4. View Results
- See real-time results after voting
- View voter lists for non-anonymous polls
- Track participation statistics

---

## 🧠 Implementation Details

This voting app demonstrates several key features:

1. **Context API**: Uses React Context to share state across components
2. **Mock Data Storage**: Implements in-memory storage for polls and votes (could be replaced with a real backend later)
3. **Verification Levels**: Respects the World ID verification levels for access control
4. **Responsive Design**: Mobile-first layout that works well on all devices
5. **Tailwind CSS**: Styling using utility-first approach for maintainable code

The implementation currently uses in-memory storage as a backend mock. To create a production-ready version, you would need to:

1. Replace the mock storage with an actual database (MongoDB, PostgreSQL, etc.)
2. Implement proper error handling and logging
3. Add more comprehensive testing
4. Set up CI/CD pipelines

---

## 🔗 Useful Links

- [World Documentation](https://docs.world.org/)
- [Developer Portal](https://developer.worldcoin.org/)
- [MiniKit Documentation](https://docs.world.org/mini-apps/quick-start/minikit)

---

## 📞 Contact

Questions or feedback? Feel free to reach out!

- **Telegram:** [@miguellalfaro](https://t.me/miguellalfaro)

---

## ℹ️ Notes

This repository is based on the official [minikit-next-template](https://github.com/worldcoin/minikit-next-template). Contributions are welcome—feel free to submit PRs!