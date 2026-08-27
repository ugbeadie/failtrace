import neo4j, { Driver } from "neo4j-driver";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      required("COGNODB_URI"),
      neo4j.auth.basic(required("COGNODB_USER"), required("COGNODB_PASSWORD")),
      { maxConnectionPoolSize: 10 },
    );
  }
  return driver;
}
