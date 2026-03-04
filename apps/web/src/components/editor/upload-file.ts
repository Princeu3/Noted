const API_URL = import.meta.env.VITE_API_URL || "";

export async function uploadFile(file: File, pageId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pageId", pageId);

  const res = await fetch(`${API_URL}/api/files/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return `${API_URL}/api/files/serve/${data.publicId}`;
}
