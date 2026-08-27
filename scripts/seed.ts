import "dotenv/config";
import { getDriver } from "../lib/db";
import {
  equipment,
  feeds,
  parts,
  hasPart,
  technicians,
  certifiedFor,
} from "./data";

async function main() {
  const driver = getDriver();

  try {
    await driver.verifyConnectivity();

    console.log("Clearing existing data...");
    await driver.executeQuery("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints...");
    for (const label of ["Equipment", "Part", "Technician"]) {
      try {
        await driver.executeQuery(
          `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS
           FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
        );
      } catch {
        console.warn(`  constraint on ${label} not supported — continuing`);
      }
    }

    console.log("Loading nodes...");
    await driver.executeQuery(
      `UNWIND $rows AS row
       CREATE (:Equipment {id: row.id, name: row.name, location: row.location})`,
      { rows: equipment },
    );
    await driver.executeQuery(
      `UNWIND $rows AS row CREATE (:Part {id: row.id, name: row.name})`,
      { rows: parts },
    );
    await driver.executeQuery(
      `UNWIND $rows AS row
       CREATE (:Technician {id: row.id, name: row.name, trade: row.trade})`,
      { rows: technicians },
    );

    console.log("Loading relationships...");
    await driver.executeQuery(
      `UNWIND $rows AS row
       MATCH (a:Equipment {id: row[0]}), (b:Equipment {id: row[1]})
       CREATE (a)-[:FEEDS]->(b)`,
      { rows: feeds },
    );
    await driver.executeQuery(
      `UNWIND $rows AS row
       MATCH (e:Equipment {id: row[0]}), (p:Part {id: row[1]})
       CREATE (e)-[:HAS_PART]->(p)`,
      { rows: hasPart },
    );
    await driver.executeQuery(
      `UNWIND $rows AS row
       MATCH (t:Technician {id: row[0]}), (e:Equipment {id: row[1]})
       CREATE (t)-[:CERTIFIED_FOR]->(e)`,
      { rows: certifiedFor },
    );

    const check = await driver.executeQuery(
      `MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label`,
    );
    console.log("\nSeeded:");
    check.records.forEach((r) =>
      console.log(`  ${r.get("label")}: ${r.get("count")}`),
    );
  } catch (err) {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await driver.close();
  }
}

main();
