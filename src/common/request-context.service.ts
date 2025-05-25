
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<Map<string, any>>();

  run(callback: () => void, context: Map<string, any>) {
    this.storage.run(context, callback);
  }

  set(key: string, value: any) {
    const store = this.storage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get<T = any>(key: string): T | undefined {
    const store = this.storage.getStore();
    return store?.get(key);
  }
}
