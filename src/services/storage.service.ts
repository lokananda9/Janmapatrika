
import { Injectable, signal } from '@angular/core';
import { openDB, IDBPDatabase, DBSchema } from 'idb';

export interface SavedProfile {
  id: string;
  name: string;
  date: string;
  time: string;
  place: string;
  timestamp: number;
}

interface LokanandaDB extends DBSchema {
  profiles: {
    key: string;
    value: SavedProfile;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly DB_NAME = 'lokananda_db';
  private dbPromise: Promise<IDBPDatabase<LokanandaDB>>;
  
  // Signal to notify components of changes automatically
  profiles = signal<SavedProfile[]>([]);

  constructor() {
    this.dbPromise = openDB<LokanandaDB>(this.DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
      },
    });
    
    // Initial load
    this.refreshProfiles();
  }

  private async refreshProfiles() {
    try {
      const db = await this.dbPromise;
      const all = await db.getAll('profiles');
      // Sort by timestamp descending (newest first)
      all.sort((a, b) => b.timestamp - a.timestamp);
      this.profiles.set(all);
    } catch (e) {
      console.error('Failed to load profiles from database', e);
    }
  }

  async saveProfile(profile: Omit<SavedProfile, 'id' | 'timestamp'>) {
    const db = await this.dbPromise;
    
    // Generate a unique ID
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Date.now().toString(36) + Math.random().toString(36).substr(2);

    const newProfile: SavedProfile = {
      ...profile,
      id,
      timestamp: Date.now()
    };

    await db.put('profiles', newProfile);
    await this.refreshProfiles();
  }

  async deleteProfile(id: string) {
    const db = await this.dbPromise;
    await db.delete('profiles', id);
    await this.refreshProfiles();
  }
}
