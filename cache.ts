import { Vault } from "obsidian";

export class Cache {
  vault: Vault;
  cacheDirectory = ".obsidian/plugins/obsidian-memodack-plugin/cache";

  constructor(vault: Vault) {
    this.vault = vault;
  }

  async add(key: string, value: string): Promise<void> {
    try {
      // Create a cache directory
      if (!(await this.vault.adapter.exists(this.cacheDirectory))) {
        await this.vault.createFolder(this.cacheDirectory);
      }

      // Write a cache file
      if (!(await this.vault.adapter.exists(`${this.cacheDirectory}/${key}`))) {
        await this.vault.adapter.write(`${this.cacheDirectory}/${key}`, value);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      // Write a cache file
      if (!(await this.vault.adapter.exists(`${this.cacheDirectory}/${key}`))) {
        return null;
      }

      return await this.vault.adapter.read(`${this.cacheDirectory}/${key}`);
    } catch (e) {
      return null;
    }
  }
}
