import { supabase } from "@/integrations/supabase/client";
import { audioFileError, audioFormat } from "@/lib/reel-rules";

export async function uploadReelAudio(userId: string, file: File) {
  const invalid = audioFileError(file);
  if (invalid) throw new Error(invalid);
  const format = audioFormat(file);
  if (!format) throw new Error("This sound format is not supported.");
  const path = `${userId}/${crypto.randomUUID()}.${format}`;
  const { error } = await supabase.storage.from("reel-audio").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw new Error(`Sound upload failed: ${error.message}`);
  return path;
}