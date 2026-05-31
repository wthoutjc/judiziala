import { cleanupE2eUser } from "./helpers/db"

export default async function globalSetup() {
  await cleanupE2eUser()
}
