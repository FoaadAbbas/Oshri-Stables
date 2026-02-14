Markdown
# 🐴 Oshri Stables Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![Database](https://img.shields.io/badge/Database-SQLite-003B57)
![AI](https://img.shields.io/badge/AI-Gemini%20Powered-8E75B2)
![PWA](https://img.shields.io/badge/Mobile-PWA%20Supported-purple)

Welcome to **Oshri Stables** – a comprehensive and intelligent platform designed for managing horse stables. This system streamlines the tracking of horse health, medical treatments, pregnancies, and daily stable activities through a modern, responsive interface optimized for both desktop and mobile devices.

## 📸 Gallery

Here is a glimpse of the system in action:

| **Dashboard & Statistics** | **Horse Profile & History** |
|:--------------------------:|:---------------------------:|
| ![Dashboard](./docs/images/dashboard.png) <br> *Overview of stable stats with quick navigation* | ![Horse Profile](./docs/images/horse-profile.png) <br> *Detailed profile with medical timeline* |

| **Pregnancy Tracker** | **AI Assistant Chatbot** |
|:---------------------:|:------------------------:|
| ![Pregnancy](./docs/images/pregnancy-tracker.png) <br> *Monitor breeding and due dates* | ![AI Chatbot](./docs/images/ai-chatbot.png) <br> *Ask questions about your data* |

---

## 🎥 Video Tutorial
Watch a short demonstration of how to manage your stable, add horses, and use the smart assistant:

[![Watch the Video](https://img.youtube.com/vi/YOUR_VIDEO_ID_HERE/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID_HERE)

*(Please replace `YOUR_VIDEO_ID_HERE` with your actual YouTube video ID)*

---

## 🚀 Key Features

* **📊 Interactive Dashboard:** A central hub displaying real-time statistics (Total Horses, Pregnant Mares, Medical Alerts) with a dedicated **Statistics** page accessible from the top navigation bar.
* **🐎 Complete Medical Records:** Track vaccinations, deworming schedules, and veterinary visits for every horse.
* **🤰 Pregnancy Management:** Monitor ultrasounds, breeding dates, and expected foaling dates with visual progress indicators.
* **🤖 Smart Assistant (Gemini AI):** An integrated chatbot that allows you to ask natural language questions about your stable data and receive instant insights.
* **📅 Visual Timeline:** View a chronological history of all events and treatments for each horse.
* **📱 Mobile Optimized (PWA):** Install the app directly on your mobile device for native-like performance and offline capabilities.
* **📁 File Management:** Upload and store images and documents for each horse securely.

---

## 🛠 Tech Stack

This project is built using modern web technologies to ensure performance and scalability:

* **Frontend:** React, Vite, TailwindCSS, Firebase (Authentication), PWA Plugin.
* **Backend:** Node.js, Express.
* **Database:** Better-SQLite3 (Fast, serverless SQL engine).
* **AI Integration:** Google Generative AI (Gemini).

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally:

### 1. Clone the Repository
```bash
git clone [https://github.com/foaadabbas/oshri-stables.git](https://github.com/foaadabbas/oshri-stables.git)
cd oshri-stables
2. Backend Setup
The server handles the database and API requests.

Bash
cd server
# Install dependencies
npm install

# Create a .env file and add your GEMINI_API_KEY
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the server
npm start
The server runs on port 3000 by default.

3. Frontend Setup
Open a new terminal for the client application.

Bash
cd client
# Install dependencies
npm install

# Start the development server
npm run dev
The application will be available at http://localhost:5173.

📱 Mobile Usage (PWA)
This application is fully PWA-compliant. To install it on your mobile device:

Open the app in your mobile browser (Chrome/Safari).

Tap "Add to Home Screen" or "Install App".

Launch it directly from your home screen like a native app.

📞 Contact Me
Fuad Abbas

📧 Email: Foaad.Abbas@e.braude.ac.il

🐙 GitHub: FoaadAbbas

💼 LinkedIn: Fuad Abbas
