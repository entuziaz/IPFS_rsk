/// <reference types="vite/client" />

interface EthereumProvider {
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface Window {
  ethereum?: EthereumProvider;
}
