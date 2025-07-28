import dns from 'dns/promises';
import os from 'os';

export class PeerManager {
  private peers: string[] = [];
  private readonly port: number;
  private readonly serviceName: string;

  constructor(serviceName: string, port: number = 4000, peers: string[] = []) {
    this.serviceName = serviceName;
    this.port = port;
    this.peers = peers;
  }

  private async resolveOwnIP(): Promise<string | null> {
    try {
      const hostname = os.hostname();
      const { address } = await dns.lookup(hostname);
      return address;
    } catch (error) {
      console.error('❌ Could not get own IP by hostname:', error);
      return null;
    }
  }

  async discoverNewPeers(): Promise<void> {
    try {
      const records = await dns.lookup(this.serviceName, { all: true });
      const ownIP = await this.resolveOwnIP();

      const discovered = records
        .filter(r => r.address !== ownIP)
        .map(r => `http://${r.address}:${this.port}`)
        .filter(peer => !this.peers.includes(peer));

      if (discovered.length > 0) {
        console.log('🔍 New peers discovered:', discovered);
        this.peers.push(...discovered);
      }
    } catch (error) {
      console.error('❌ Error discovering peers:', error);
    }
  }

  getPeers(): string[] {
    return this.peers;
  }
}
