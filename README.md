# John: AI English Assessment Demo

**John** is a web app that records video, analyzes audio with AI, and identifies the speaker's native language from their English accent, simplifying language assessment.

## Why "John"?

The code name **John** is inspired by [**John Manjirō**](https://en.wikipedia.org/wiki/Nakahama_Manjir%C5%8D), also known as **Nakahama Manjirō** (中濱 万次郎), who was one of the first Japanese people to visit the United States.

## Project Structure

```plaintext
.
├── Dockerfile                # Production Docker configuration
├── Dockerfile.dev            # Development Docker configuration
├── README.md                 # Project overview
├── compose.yaml              # Docker Compose setup
├── next-env.d.ts             # Next.js TypeScript environment
├── next.config.ts            # Next.js configuration
├── node_modules              # Installed dependencies
├── package.json              # Project scripts and dependencies
├── pnpm-lock.yaml            # pnpm lock file
├── public                    # Static assets (favicon, images)
├── src                       # Application code
│   ├── app                   # App routes and main layout
│   │   ├── api               # API endpoints
│   │   │   └── s3-presigned-url
│   │   │       └── route.ts  # S3 URL API route
│   │   ├── favicon.ico
│   │   ├── fonts             # Custom fonts
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Global layout component
│   │   └── page.tsx          # Main page component
│   └── components            # Reusable UI components
│       ├── UploadButton.tsx  # Video upload button
│       ├── VideoPreview.tsx  # Recorded video preview
│       └── VideoRecorder.tsx # Video recording component
└── tsconfig.json             # TypeScript configuration
```

## Features

- **Video Recording and Preview**: The app allows users to record video and preview it before uploading.
- **S3 Presigned URL Generation**: Uploads are facilitated by generating a presigned S3 URL for secure and temporary file storage.
- **AI-Powered Analysis**: Audio data is processed by AI to evaluate the user's English skills and detect their native language.

## Usage Instructions

### Prerequisites

- **Docker** and **Docker Compose** installed
- **pnpm** for package management (optional, recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/knot-inc/john.git
   cd john
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

### Running the Demo

1. **Development Mode** (with live reloading):

   ```bash
   docker compose up dev
   ```

   - Access the app at `http://localhost:3000`.

2. **Production Mode**:

   ```bash
   docker compose up --build prod
   ```

   - The app will be available at `http://localhost:8080`.

## Scripts and Commands

- **`pnpm dev`**: Start the development server with hot reloading.
- **`pnpm build`**: Build the app for production.
- **`pnpm start`**: Start the production server.
- **`pnpm lint`**: Run ESLint to check for code quality issues.
- **`pnpm format`**: Format the codebase with Prettier.

### Docker Compose

- **Development**:

  ```bash
  docker compose up dev
  ```

- **Production**:

  ```bash
  docker compose up prod
  ```

- **Clean Build** (useful if you update dependencies):

  ```bash
  docker compose build --no-cache
  ```

## Code Quality and Formatting

- This project uses **ESLint** and **Prettier** for code consistency.

### Format and Lint

1. **Format All Files**:

   ```bash
   pnpm format
   ```

2. **Lint Check**:

   ```bash
   pnpm lint
   ```

```

```
