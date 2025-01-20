# Citadel

A hierarchical command-line interface (CLI) for web applications.

# Installation

```bash
npm install citadel_cli
```

## Quick Start

In your application:

```typescript
const commands = {
  user: {
    show: {
      description: 'Show user details',
      argument: { name: 'userId', description: 'Enter user ID' },
      handler: async (args: string[]) => {
        // Pause to simulate a long request
        await new Promise(resolve => setTimeout(resolve, 2000));

        return new JsonCommandResult({
          id: args[0],
          name: "John Doe",
          email: "john@example.com",
          status: "active"
        });
      },
    },
  }
};

function App() {
  return (
    <>
      <Citadel commands={commands} />
    </>
  );
}
```

Press <kbd>.</kbd> (period) to activate Citadel. The above configuration you would render the following:


Note that the exact keys pressed to perform the command were <kbd>us123</kbd>. You only have to press the first letter of each word to advance to the next. 

Each command is composed of:
1. `description`. Required.
2. `argument` Optional. One or more arguments, each with a `name` and a `description`
3. A `handler`. Required. The `handler` is what gets executed when you hit Enter, and can be any valid JavaScript. The only requirement is that it must return a `CommandResult` class. At the time of this writing they are `JsonCommandResult`, `TextCommandResult`, `ImageCommandResult`, and `ErrorCommandResult`.

```typescript
commands.addCommand(
  ['user', 'activity'],
  'Show user activity',
  async (args) => ({
    // Return both data and visualization
    json: await getUserActivity(args.userId),
    component: <ActivityGraph userId={args.userId} />
  })
);
```

## Real-World Examples

### Customer Service Application

```typescript
// Customer service command configuration
commands.addCommand(
  ['ticket', 'new'],
  'Create support ticket',
  async (args) => {
    const ticket = await ticketService.create({
      customerId: args.customer,
      priority: args.priority,
      description: args.description
    });
    return { json: { ticketId: ticket.id, status: 'created' } };
  },
  [
    { name: 'customer', description: 'Customer ID' },
    { name: 'priority', description: 'Ticket priority (high|medium|low)' },
    { name: 'description', description: 'Issue description' }
  ]
);

commands.addCommand(
  ['customer', 'history'],
  'View customer interaction history',
  async (args) => ({
    json: await customerService.getHistory(args.id, {
      last: args.days || 30
    })
  }),
  [
    { name: 'id', description: 'Customer ID' },
    { name: 'days', description: 'Number of days (default: 30)' }
  ]
);
```

### Trading Platform Integration

```typescript
// Trading command configuration
commands.addCommand(
  ['trade', 'limit'],
  'Place limit order',
  async (args) => {
    const order = await tradingService.placeLimitOrder({
      pair: args.pair,
      price: args.price,
      quantity: args.quantity,
      side: args.side || 'buy'
    });
    return { json: { orderId: order.id, status: order.status } };
  },
  [
    { name: 'pair', description: 'Trading pair (e.g., btc-usd)' },
    { name: 'price', description: 'Limit price' },
    { name: 'quantity', description: 'Order quantity' },
    { name: 'side', description: 'Order side (buy|sell)' }
  ]
);
```

### DevOps Dashboard Commands

```typescript
// Deployment command configuration
commands.addCommand(
  ['deploy', 'status'],
  'Check deployment status',
  async (args) => ({
    json: await deploymentService.getStatus(args.service, args.environment)
  }),
  [
    { name: 'service', description: 'Service name' },
    { name: 'environment', description: 'Environment (dev|staging|prod)' }
  ]
);

commands.addCommand(
  ['metrics', 'alert'],
  'Configure service alerts',
  async (args) => ({
    json: await metricsService.setAlert(args.service, {
      metric: args.metric,
      threshold: args.threshold,
      duration: args.duration
    })
  }),
  [
    { name: 'service', description: 'Service name' },
    { name: 'metric', description: 'Metric name (cpu|memory|latency)' },
    { name: 'threshold', description: 'Alert threshold' },
    { name: 'duration', description: 'Duration in minutes' }
  ]
);
```

## Advanced Configuration

### Custom Command Rendering

Citadel supports custom rendering of command results:

```typescript
commands.addCommand(
  ['dashboard', 'metrics'],
  'Show service metrics',
  async (args) => ({
    component: <MetricsVisualization serviceId={args.service} />,
    json: await metricsService.get(args.service)
  }),
  { name: 'service', description: 'Service ID' }
);
```

### Authentication Integration

```typescript
const citadelConfig = {
  commandFilter: (command) => {
    const userPermissions = getUserPermissions();
    return command.requiredPermissions.every(
      (perm) => userPermissions.includes(perm)
    );
  },
  // ... other config
};
```

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

Contributions are welcome.

1. Clone the repository:
```bash
git clone https://github.com/jchilders/citadel_react.git
cd citadel_react
```

2. Install dependencies:
```bash
npm install
```

3. Build the package:
```bash
npm run build
```

4. (Optional but recommended) Link citadel so you can import it into a parallel project
```bash
npm link
```

5. (Optional) From the directory of the project you want to import Citadel into:
```bash
npm link @jchilders/citadel_cli
# ... your normal build/run steps ...
```

### Bug Reports and Feature Requests

- Use the GitHub Issues section to report bugs or suggest features
- Before creating a new issue, please check if a similar issue already exists
- Provide as much detail as possible in bug reports:
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Browser/environment information
  - Error messages or screenshots if applicable

### Development Process

1. Fork the repository
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
3. Make your changes
4. Write or update tests as needed
5. Run the test suite to ensure everything passes:
   ```bash
   npm test
   ```
6. Commit your changes with a clear and descriptive commit message
7. Push to your fork and submit a pull request

### Pull Request Guidelines

- Keep your changes focused. Submit separate pull requests for separate features/fixes
- Follow the existing code style and conventions
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Describe your changes in detail in the pull request description

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Comment complex logic or non-obvious code
- Keep functions focused and modular
- Use consistent formatting (the project uses ESLint and Prettier)

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Citadel is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

This means you can use Citadel in your own projects (commercial or non-commercial) as long as you include the original copyright notice and license terms. The MIT License is simple and permissive, allowing you to:

- Use the code commercially
- Modify the code
- Distribute the code
- Use in private/closed-source projects

All we ask is that you include the original license and copyright notice in any copy or substantial portion of the software.
