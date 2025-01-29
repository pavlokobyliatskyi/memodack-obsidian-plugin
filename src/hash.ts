export class Hash {
  static async sha256(data: string): Promise<string> {
    // Convert the string to a byte array
    const msgBuffer = new TextEncoder().encode(data);

    // Compute the hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    // Convert the hash to a byte array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert the byte array to a hexadecimal string
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }
}
