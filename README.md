# Fityard Fitness Academy Frontend

A modern frontend application for Fityard Fitness Academy, built with Vite.

## Features

- Fast development with Vite
- Secure HTML sanitization with DOMPurify
- Static asset copying with vite-plugin-static-copy
- Modular integrations for various functionalities

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fityard-fitness-academy-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server, typically on `http://localhost:5173`.

## Build

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

- `src/` - Source code
- `public/` - Static assets
- `integrations/` - Custom Vite integrations
- `vite.config.js` - Vite configuration

## Technologies Used

- **Vite** - Build tool and development server
- **DOMPurify** - HTML sanitization
- **vite-plugin-static-copy** - Static asset copying

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.