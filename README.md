# Citadel

A command-line interface for web applications that empowers power users with keyboard-driven access to functionality.

## Purpose

Citadel transforms web applications by providing a command palette interface similar to VS Code or Sublime Text, enabling power users to execute complex operations without leaving their keyboard. It significantly reduces cognitive load and improves workflow efficiency in complex web applications.

It is intended to serve as an interface for web applications that require users to navigate through multiple UI layers to perform common tasks, and was designed with RESTful API endpoints in mind.

## Why Citadel?

Modern web applications often require users to navigate through multiple UI layers to perform common tasks. Consider these scenarios where Citadel shines:

## Examples

### Customer Service Portal
**Without Citadel:**
```
1. Click Customer tab
2. Open search form
3. Enter customer ID
4. Click search
5. Navigate to tickets tab
6. Click create ticket
7. Fill form
```

**With Citadel:**
Type in `tn1234`, which expands to:
```
> ticket new 1234
```

### Financial Trading Platform
**Without Citadel:**
```
1. Select trading pair
2. Open order form
3. Switch to limit order
4. Enter price and quantity
5. Review and submit
```

**With Citadel:**
Type `tlbu5000 0.5`, which expands to:
```
> trade limit btc usd 50000 0.5
```

### DevOps Dashboard
**Without Citadel:**
```
1. Navigate to deployments
2. Filter by environment
3. Select service
4. Click rollback
5. Confirm action
```

**With Citadel:**
Type in `drap1.2.3`, which expands to:
```
> deploy rollback api-service prod 1.2.3
```

## Features

- [x] **Keyboard Navigation**: Complete keyboard control with customizable shortcuts
- [x] **Instant Command Access**: Sub-100ms response time for command suggestions
- [x] **Context-Aware Commands**: Commands can be configured on a per-page or per-app basis

Coming soon:
- [ ] **Command History**: Quick access to recent and frequent commands
- [ ] **Themeable Interface**: Seamlessly matches your application's design
- [ ] **Real-Time Updates**: Live command results with WebSocket support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jchilders/citadel.git
cd citadel
```

2. Install dependencies:
```bash
npm install
```

3. Build the package:
```bash
npm run build
```

4. Link for local development (optional):
```bash
npm link
```

## Quick Start

```typescript
import { Citadel, CommandTrie } from 'citadel';

// Initialize command system
const commands = new CommandTrie();

// Register commands
commands.addCommand(
  ['customer', 'search'],
  'Search for customer records',
  async (args) => ({
    json: await customerService.search(args.query)
  }),
  { name: 'query', description: 'Customer name or ID' }
);

// Mount in your React app
function App() {
  return (
    <div>
      <Citadel commands={commands} />
      {/* Your app content */}
    </div>
  );
}
```

## Command Usage

Citadel commands composed of one or more words followed by zero or one arguments. For example:
```
> ticket new customer 1234
```
Where the user typed "tnc1234" to achieve the above result.


### Quick Execution

Commands can be typed using abbreviated forms. For example:
```
ticket new   →  tn
deploy status  →  ds
customer history  →  ch
```

Simply type the first letter of each word in the command and press Enter. 

### Arguments

Commands can have zero or more arguments.

```bash
> ticket new customer 1234 
```

### JavaScript Integration

Commands can execute any JavaScript code, making them powerful automation tools:

```typescript
commands.addCommand(
  ['refresh', 'cache'],
  'Refresh application cache',
  async () => {
    // Clear local storage
    localStorage.clear();
    // Reset Redux store
    store.dispatch(resetState());
    // Reload application
    window.location.reload();
    return { json: { status: 'Cache cleared' } };
  }
);
```

### Dynamic Results

Commands can return different types of results:
- JSON data for structured information
- React components for rich visualizations
- Plain text for simple outputs
- Promises for async operations

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

We welcome contributions to Citadel! Here's how you can help:

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
