interface DocumentPictureInPictureEvent extends Event {
  readonly window: Window;
}

interface DocumentPictureInPicture {
  readonly isEnabled: boolean;
  requestWindow(options?: {
    width?: number;
    height?: number;
  }): Promise<Window>;
  readonly window: Window | null;
  onenter: ((this: DocumentPictureInPicture, ev: DocumentPictureInPictureEvent) => any) | null;
}

declare interface Document {
  readonly documentPictureInPicture: DocumentPictureInPicture;
}

declare interface Window {
    documentPictureInPicture: DocumentPictureInPicture;
}
