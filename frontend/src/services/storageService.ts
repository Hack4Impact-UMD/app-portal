import type { UploadMetadata } from "firebase/storage";
import {
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { storage } from "@/config/firebase";

export async function uploadFile(
  file: File,
  path: string,
  onProgress: (progress: number) => void,
  metadata?: UploadMetadata,
): Promise<string> {
  const fileRef = ref(storage, path);

  const timeout = new Promise<string>((_, reject) =>
    setTimeout(() => reject("Timeout!"), 1000 * 60),
  );

  const upload = new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file, metadata);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
      },
      (err) => {
        console.log("storage error", err);
        return reject(err);
      },
      async () => {
        return resolve(fileRef.fullPath);
      },
    );
  });

  return Promise.race([upload, timeout]);
}

export async function getFileURL(path: string) {
  return await getDownloadURL(ref(storage, path));
}

export async function getFileMetadata(path: string) {
  return await getMetadata(ref(storage, path));
}
