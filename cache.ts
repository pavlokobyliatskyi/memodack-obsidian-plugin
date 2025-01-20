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

  // TODO: Move to another place? (cache-manager)
  // Return size of cache directory
  async getCacheSize(): Promise<number> {
    try {
      // Check if cache directory exist
      if (!(await this.vault.adapter.exists(this.cacheDirectory))) {
        // And disable "Clear" button in settings
        return 0;
      }

      const stat = await this.vault.adapter.stat(this.cacheDirectory);

      if (!stat || !stat?.size) {
        // And disable "Clear" button in settings
        return 0;
      }

      return stat.size;
    } catch (e) {
      // And disable "Clear" button in settings
      return 0;
    }
  }

  // Remove all files in cache directory
  async clearCache(): Promise<void> {
    try {
      // Check if cache directory exist
      if (!(await this.vault.adapter.exists(this.cacheDirectory))) {
        return;
      }

      await this.vault.adapter.rmdir(this.cacheDirectory, true);
    } catch (e) {
      //
    }
  }
}
