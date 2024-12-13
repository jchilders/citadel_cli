import { JsonCommandResult, TextCommandResult } from '../src/components/Citadel/types/command-results';

export const commands = {
  'deploy.production': {
    description: 'Deploy to production environment',
    handler: async (args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return new JsonCommandResult({
        environment: 'production',
        version: args[0],
        status: 'in_progress',
        steps: [
          { name: 'validate_version', status: 'completed' },
          { name: 'backup_database', status: 'in_progress' },
          { name: 'deploy_containers', status: 'pending' }
        ],
        timestamp: new Date().toISOString()
      });
    },
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  },

  'deploy.staging': {
    description: 'Deploy to staging environment',
    handler: async (args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return new JsonCommandResult({
        environment: 'staging',
        version: args[0],
        status: 'in_progress',
        steps: [
          { name: 'validate_version', status: 'completed' },
          { name: 'deploy_containers', status: 'in_progress' }
        ],
        timestamp: new Date().toISOString()
      });
    },
    argument: { name: 'version', description: 'Version to deploy (e.g., 1.2.3)' }
  },

  'monitor.logs': {
    description: 'View application logs',
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate timestamps starting from 1 hour ago
      const baseTime = new Date('2024-12-12T21:31:42-05:00');
      baseTime.setHours(baseTime.getHours() - 1);
      
      const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(',', '');
      };

      const generateTimestamp = (secondsAgo: number) => {
        const date = new Date(baseTime.getTime() + (secondsAgo * 1000));
        return formatDate(date);
      };

      const logMessages = [
        `${generateTimestamp(50)} [INFO] api-server-1 | Request completed: GET /api/users/123 (200) - 45ms`,
        `${generateTimestamp(45)} [WARN] db-primary | High query latency detected: SELECT * FROM users WHERE last_login > ? (890ms)`,
        `${generateTimestamp(40)} [INFO] auth-service | User 'jsmith' authenticated successfully from IP 192.168.1.105`,
        `${generateTimestamp(35)} [ERROR] payment-service | Failed to process transaction: Invalid card number (ref: tx_789012)`,
        `${generateTimestamp(30)} [INFO] cache-service | Cache hit ratio: 87.5% (hits: 1205, misses: 172)`,
        `${generateTimestamp(25)} [WARN] api-server-2 | Rate limit approaching for client_id: 'mobile-app-v2' (95/100 requests)`,
        `${generateTimestamp(20)} [INFO] queue-worker | Processed 150 messages from 'notifications' queue in 2.3s`,
        `${generateTimestamp(15)} [ERROR] auth-service | Failed login attempt for user 'admin' from suspicious IP 203.0.113.42`,
        `${generateTimestamp(10)} [INFO] metrics-collector | System load average: 0.75, Memory usage: 82%, Disk I/O: 120MB/s`,
        `${generateTimestamp(5)} [WARN] db-replica | Replication lag detected: 2.5s behind primary`
      ].join("\n");

      return new TextCommandResult(logMessages);
    }
  },

  'monitor.metrics': {
    description: 'View system metrics',
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return new JsonCommandResult({
        cpu: {
          usage: 78.5,
          cores: 8,
          processes: 245
        },
        memory: {
          used: '12.4GB',
          available: '3.6GB',
          swap: '2.1GB'
        },
        network: {
          incoming: '1.2MB/s',
          outgoing: '0.8MB/s',
          connections: 1250
        },
        timestamp: new Date().toISOString()
      });
    }
  },

  'infra.scale': {
    description: 'Scale infrastructure resources',
    handler: async (args: string[]) => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const instances = parseInt(args[0]);
      return new JsonCommandResult({
        service: 'web-server',
        currentInstances: Math.max(1, instances - 2),
        targetInstances: instances,
        status: 'scaling_up',
        estimatedTimeRemaining: '3m',
        regions: ['us-east-1', 'us-west-2'],
        healthStatus: 'healthy'
      });
    },
    argument: { name: 'instances', description: 'Number of instances' }
  }
};
