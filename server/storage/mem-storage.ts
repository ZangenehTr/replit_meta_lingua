import type { IStorage } from "./storage-types";
import { MemStorageMisc } from "./misc-storage";

export class MemStorage extends MemStorageMisc implements IStorage {
  constructor(db?: any) {
    super(db);
  }
}
