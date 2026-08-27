import "dotenv/config";
import { getDriver } from "../lib/db";

async function main() {
  const driver = getDriver();

  try {
    await driver.verifyConnectivity();
    console.log("Connected.");

    const result = await driver.executeQuery("RETURN $message AS message", {
      message: "Bolt is working",
    });
    console.log(result.records[0].get("message"));
  } catch (err) {
    console.error(
      "Connection failed:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();
