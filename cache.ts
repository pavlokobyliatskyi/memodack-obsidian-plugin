import { PluginManifest, Vault } from "obsidian";

export class Cache {
  cacheDirectory: string;
  vault: Vault;
  manifest: PluginManifest;

  constructor(vault: Vault, manifest: PluginManifest) {
    this.vault = vault;
    this.manifest = manifest;

    this.cacheDirectory = this.manifest?.dir
      ? `${this.manifest.dir}/cache`
      : `${this.vault.configDir}/plugins/${this.manifest.id}/cache`;
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
