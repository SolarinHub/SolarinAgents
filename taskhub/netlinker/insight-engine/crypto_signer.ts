export class SigningEngine {
  private keyPairPromise: Promise<CryptoKeyPair>

  constructor() {
    // Generate the key asynchronously and store the promise
    this.keyPairPromise = crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    )
  }

  private async getKeyPair(): Promise<CryptoKeyPair> {
    return await this.keyPairPromise
  }

  async sign(data: string): Promise<string> {
    const enc = new TextEncoder().encode(data)
    const { privateKey } = await this.getKeyPair()
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, enc)
    return Buffer.from(sig).toString("base64")
  }

  async verify(data: string, signature: string): Promise<boolean> {
    const enc = new TextEncoder().encode(data)
    const sig = Buffer.from(signature, "base64")
    const { publicKey } = await this.getKeyPair()
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, sig, enc)
  }

  async exportPublicKey(): Promise<string> {
    const { publicKey } = await this.getKeyPair()
    const spki = await crypto.subtle.exportKey("spki", publicKey)
    return Buffer.from(spki).toString("base64")
  }

  async exportPrivateKey(): Promise<string> {
    const { privateKey } = await this.getKeyPair()
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey)
    return Buffer.from(pkcs8).toString("base64")
  }
}
