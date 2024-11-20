# Citadel

Citadel is a React component that lets you do common operations in a webapp quickly.


## Features

- Clean, intuitive chat interface
- Real-time message streaming
- Customizable themes and styling
- TypeScript support for type safety
- Built on Vite for fast development and optimal production builds

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/citadel.git
cd citadel
```

2. Install dependencies:
```bash
npm install
```

## Getting Started

To run Citadel locally in development mode:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`. The app supports hot module replacement (HMR) for quick development iterations.

For production builds:

```bash
npm run build
npm run preview
```

## Customization

### Themes
Citadel supports custom themes through CSS variables. To modify the appearance:

1. Create a new theme file in `src/styles/themes/`
2. Import and apply your theme in `src/styles/main.css`
3. Update theme variables as needed:

```css
:root {
  --primary-color: #your-color;
  --background-color: #your-color;
  --text-color: #your-color;
}
```

### Components
You can customize existing components or add new ones in the `src/components/` directory. Each component should be typed using TypeScript interfaces.

## Development

### Project Structure
```
citadel/
├── src/
│   ├── components/    # React components
│   ├── styles/        # CSS and theme files
│   ├── types/         # TypeScript definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
└── vite.config.ts     # Vite configuration
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your chosen license]

## Support

For issues and feature requests, please use the GitHub issues tracker.