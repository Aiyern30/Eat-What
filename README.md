# Eat What? 🍽️

A modern, interactive restaurant discovery application designed to solve the age-old question: **"What should we eat?"**. Built with Next.js and Google Maps, this app helps users explore nearby restaurants, filter by preferences, and use a fun "Spin the Wheel" feature to make random decisions.

## ✨ Features

- **🗺️ Interactive Google Map**: Browse restaurants on a dynamic map with smooth interactions and 3D capabilities.
- **🎡 Decision Wheel**: Can't decide? Let the gamified "Spin the Wheel" pick a place for you!
- **🔍 Smart Filtering**: Easily find what you need by filtering for cuisine, price range, open status, and more.
- **📄 Rich Restaurant Details**: View comprehensive information including ratings, photos, opening hours, and price levels.
- **❤️ User Favorites**: Login with Google to save your favorite spots and access them anytime.
- **🎨 Map Themes**: Customize your browsing experience with various map visual styles (Dark, Retro, Silver, etc.).
- **📱 Fully Responsive**: A seamless experience across desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

This project is built with the latest modern web technologies:

### Core

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### UI & Components

- **Component Library**: [Shadcn UI](https://ui.shadcn.com/) (Built on [Radix UI](https://www.radix-ui.com/))
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations/Interactions**: [Vaul](https://vaul.emilkowal.ski/) (Drawer), [Sonner](https://sonner.emilkowal.ski/) (Toasts)
- **Carousel**: [Embla Carousel](https://www.embla-carousel.com/)

### Integrations & Tools

- **Maps**: [Google Maps Platform](https://developers.google.com/maps) (`@react-google-maps/api`)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

Follow these steps to get the project running locally.

### Prerequisites

- Node.js (v18+ recommended)
- A Google Maps Cloud Project with Maps JavaScript API enabled
- A Google Cloud Project for OAuth (if using Login features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/eat-what.git
   cd eat-what
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add the following keys:

   ```env
   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # NextAuth / Google Auth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_generated_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the app in action.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
