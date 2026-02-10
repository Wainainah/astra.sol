/**
 * Token metadata fetching utilities
 */

export async function fetchMetadata(uri: string): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch metadata from URI:", uri, error);
    return {};
  }
}

export function getImageFromMetadata(metadata: Record<string, unknown>): string | null {
  if (typeof metadata.image === "string") return metadata.image;
  if (typeof metadata.icon === "string") return metadata.icon;
  if (typeof metadata.logo === "string") return metadata.logo;
  return null;
}
