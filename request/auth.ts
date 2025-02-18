interface OutgoingMessage {
  action: string;
  requestId: string;
  payload: Payload;
}

interface IncomingMessage {
  responseId?: string;  // Assuming this is optional or might not exist
  payload: Payload;
}

type Payload = any; // Replace with a more specific type as needed
class SDK {
  private pendingRequests: Map<string, (value: Payload) => void>;

  constructor() {
    this.pendingRequests = new Map();
    this.listenToMessages();
  }

  private generateRequestId(): string {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  private listenToMessages(): void {
    window.addEventListener('message', (event: MessageEvent) => {

      // Add origin checks here for security
      const data: IncomingMessage = event.data;
      // Check if this message is a response to one of our requests
      if (data.responseId && this.pendingRequests.has(data.responseId)) {

        const resolve = this.pendingRequests.get(data.responseId);
        if (resolve) {
          resolve(data.payload);
          this.pendingRequests.delete(data.responseId);
        }
      }
    }, false);
  }

  public sendMessage(action: string, payload: Payload = {}): Promise<Payload> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      this.pendingRequests.set(requestId, resolve);

      const message: OutgoingMessage = {
        action,
        requestId,
        payload
      };

      try {
        if(window.parent.location.origin !== window.location.origin) {
          window.parent.postMessage(message, "*");
        } else {
          reject()
        }
      } catch {
        window.parent.postMessage(message, "*");
      }
    });
  }

  // Example SDK method
  public async getUser(): Promise<Payload> {
    return this.sendMessage('getUser');
  }

  // Another SDK method
  public async requestUserToken(): Promise<Payload> {
    return this.sendMessage('requestUserToken');
  }

  public async requestRenderMode(): Promise<Payload> {
    return this.sendMessage('requestRenderMode');
  }
}

export default new SDK();
