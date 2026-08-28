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

    const r = await driver.executeQuery(
      `MATCH (:Equipment {id:'GEN-01'})-[:FEEDS*1..10]->(d:Equipment)
       RETURN count(DISTINCT d) AS reach`,
    );
    console.log("GEN-01 reaches:", r.records[0].get("reach").toNumber());
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
