import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutputManager } from '../OutputManager';
import { OutputStream } from '../OutputStream';
import { TextCommandResult } from '../../types/command-results';
import { IOutputFormatter, OutputFormat } from '../../types/command-output';

describe('OutputManager', () => {
  let manager: OutputManager;
  let output: string[];

  beforeEach(() => {
    output = [];
    const stream = new OutputStream(text => output.push(text));
    manager = new OutputManager(stream);
  });

  describe('formatters', () => {
    it('should use text formatter by default', () => {
      const result = new TextCommandResult('test');
      manager.writeResult(result);
      expect(output[0]).toBe('test\n');
    });

    it('should use json formatter', () => {
      const result = new TextCommandResult({ key: 'value' });
      manager.writeResult(result, { format: 'json' });
      expect(JSON.parse(output[0])).toEqual({ key: 'value' });
    });

    it('should use table formatter', () => {
      const result = new TextCommandResult([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]);
      manager.writeResult(result, {
        format: 'table',
        columns: [
          { header: 'Name', field: 'name' },
          { header: 'Age', field: 'age' }
        ]
      });
      expect(output[0]).toContain('Name | Age');
      expect(output[0]).toContain('John | 30');
      expect(output[0]).toContain('Jane | 25');
    });

    it('should use markdown formatter', () => {
      const result = new TextCommandResult({
        title: 'Test',
        items: ['one', 'two', 'three']
      });
      manager.writeResult(result, { format: 'markdown' });
      expect(output[0]).toContain('**title**: Test');
      expect(output[0]).toContain('### items');
      expect(output[0]).toContain('- one');
    });

    it('should use html formatter', () => {
      const result = new TextCommandResult({
        title: 'Test',
        items: ['one', 'two', 'three']
      });
      manager.writeResult(result, { format: 'html' });
      expect(output[0]).toContain('<strong>title</strong>');
      expect(output[0]).toContain('<h3>items</h3>');
      expect(output[0]).toContain('<ul>');
    });

    it('should use custom formatter', () => {
      const customFormatter: IOutputFormatter = {
        format: () => 'custom',
        getFormat: () => 'custom' as OutputFormat
      };
      manager.registerFormatter(customFormatter);
      
      const result = new TextCommandResult('test');
      manager.writeResult(result, { format: 'custom' });
      expect(output[0]).toBe('custom\n');
    });

    it('should throw for unknown format', () => {
      const result = new TextCommandResult('test');
      expect(() => {
        manager.writeResult(result, { format: 'unknown' as OutputFormat });
      }).toThrow('No formatter registered for format: unknown');
    });
  });

  describe('output options', () => {
    it('should apply indentation', () => {
      const result = new TextCommandResult('test');
      manager.writeResult(result, {
        style: { indent: 2 }
      });
      expect(output[0]).toBe('  test\n');
    });

    it('should apply word wrap', () => {
      const result = new TextCommandResult('this is a long text that should be wrapped');
      manager.writeResult(result, {
        style: { maxWidth: 20, wordWrap: true }
      });
      const lines = output[0].split('\n');
      expect(lines[0]).toBe('this is a long text');
      expect(lines[1]).toBe('that should be');
      expect(lines[2]).toBe('wrapped');
    });

    it('should apply truncation', () => {
      const result = new TextCommandResult('this is a very long text');
      manager.writeResult(result, {
        style: { maxWidth: 10, truncate: true }
      });
      expect(output[0]).toBe('this is ...\n');
    });

    it('should merge options', () => {
      const stream = manager.getOutputStream();
      stream.setOptions({
        style: { indent: 2 }
      });

      const result = new TextCommandResult('test');
      manager.writeResult(result, {
        style: { maxWidth: 10 }
      });

      const options = stream.getOptions();
      expect(options.style?.indent).toBe(2);
      expect(options.style?.maxWidth).toBe(10);
    });
  });

  describe('templates', () => {
    it('should use markdown template', () => {
      const result = new TextCommandResult({
        title: 'Test',
        description: 'Description'
      });
      manager.writeResult(result, {
        format: 'markdown',
        template: '# {{title}}\n\n{{description}}'
      });
      expect(output[0]).toBe('# Test\n\nDescription\n');
    });

    it('should use html template', () => {
      const result = new TextCommandResult({
        title: 'Test',
        description: 'Description'
      });
      manager.writeResult(result, {
        format: 'html',
        template: '<h1>{{title}}</h1><p>{{description}}</p>'
      });
      expect(output[0]).toBe('<h1>Test</h1><p>Description</p>\n');
    });

    it('should handle nested template values', () => {
      const result = new TextCommandResult({
        user: {
          name: 'John',
          profile: {
            age: 30
          }
        }
      });
      manager.writeResult(result, {
        format: 'markdown',
        template: '{{user.name}} is {{user.profile.age}} years old'
      });
      expect(output[0]).toBe('John is 30 years old\n');
    });
  });
});
