import { Client, Databases } from "appwrite"

// Appwrite configuration
export const client = new Client()

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId)
}

export const databases = new Databases(client)

// Database and collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ""
export const COMMENTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID || ""
