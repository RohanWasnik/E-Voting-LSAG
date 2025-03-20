// Improved LSAG implementation for browser environment
export class LSAG {
  private static instance: LSAG;

  private constructor() {}

  static getInstance(): LSAG {
    if (!LSAG.instance) {
      LSAG.instance = new LSAG();
    }
    return LSAG.instance;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const matches = hex.match(/.{1,2}/g) || [];
    return new Uint8Array(matches.map(byte => parseInt(byte, 16))).buffer;
  }

  async generateKeyPair(): Promise<{publicKey: string, privateKey: string}> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign", "verify"]
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "raw",
        keyPair.publicKey
      );
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      return {
        publicKey: this.arrayBufferToHex(publicKeyBuffer),
        privateKey: this.arrayBufferToHex(privateKeyBuffer)
      };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error('Failed to generate cryptographic keys');
    }
  }

  async sign(message: string, privateKey: string): Promise<string> {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const keyBuffer = this.hexToArrayBuffer(privateKey);

      const cryptoKey = await window.crypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        false,
        ["sign"]
      );

      const signature = await window.crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: {name: "SHA-256"},
        },
        cryptoKey,
        msgBuffer
      );

      return this.arrayBufferToHex(signature);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Failed to create digital signature');
    }
  }

  async verify(message: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const sigBuffer = this.hexToArrayBuffer(signature);
      const keyBuffer = this.hexToArrayBuffer(publicKey);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        false,
        ["verify"]
      );

      return await window.crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: {name: "SHA-256"},
        },
        cryptoKey,
        sigBuffer,
        msgBuffer
      );
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  // Helper method to generate a unique tag for linking signatures
  async generateLinkableTag(privateKey: string, message: string): Promise<string> {
    try {
      const tag = await this.sign(message + privateKey, privateKey);
      return tag;
    } catch (error) {
      console.error('Failed to generate linkable tag:', error);
      throw new Error('Failed to generate signature tag');
    }
  }
}