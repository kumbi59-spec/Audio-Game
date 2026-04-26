export interface UploadProgressEvent {
  stage: "receiving" | "extracting" | "analysing" | "creating" | "done" | "error";
  message: string;
  worldId?: string;
  worldName?: string;
}
