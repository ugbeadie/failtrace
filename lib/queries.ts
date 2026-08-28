import { getDriver } from "./db";
import type {
  Equipment,
  EquipmentDetail,
  DownstreamItem,
  Part,
  Technician,
  SharedPart,
  CriticalityRow,
} from "../types";

const MAX_DEPTH = 10;

export async function listEquipment(): Promise<Equipment[]> {
  const { records } = await getDriver().executeQuery(
    `MATCH (e:Equipment)
     OPTIONAL MATCH (e)-[:FEEDS*1..10]->(d:Equipment)
     WITH e, count(DISTINCT d) AS impact
     RETURN e.id AS id, e.name AS name, e.location AS location, impact
     ORDER BY e.location, impact DESC, e.name`,
  );
  return records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    location: r.get("location"),
    impact: r.get("impact").toNumber(),
  }));
}

export async function getEquipmentDetail(
  id: string,
): Promise<EquipmentDetail | null> {
  const driver = getDriver();

  const base = await driver.executeQuery(
    `MATCH (e:Equipment {id: $id})
     RETURN e.id AS id, e.name AS name, e.location AS location`,
    { id },
  );
  if (base.records.length === 0) return null;

  const b = base.records[0];
  const equipment: Equipment = {
    id: b.get("id"),
    name: b.get("name"),
    location: b.get("location"),
  };

  // QUERY 1 — blast radius. Multi-hop traversal of unknown depth.
  const down = await driver.executeQuery(
    `MATCH path = (:Equipment {id: $id})-[:FEEDS*1..${MAX_DEPTH}]->(d:Equipment)
     WITH d, min(length(path)) AS hops
     RETURN d.id AS id, d.name AS name, d.location AS location, hops
     ORDER BY hops, d.name`,
    { id },
  );
  const downstream: DownstreamItem[] = down.records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    location: r.get("location"),
    hops: r.get("hops").toNumber(),
  }));

  const partsResult = await driver.executeQuery(
    `MATCH (:Equipment {id: $id})-[:HAS_PART]->(p:Part)
     RETURN p.id AS id, p.name AS name ORDER BY p.name`,
    { id },
  );
  const parts: Part[] = partsResult.records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
  }));

  const techResult = await driver.executeQuery(
    `MATCH (t:Technician)-[:CERTIFIED_FOR]->(:Equipment {id: $id})
     RETURN t.id AS id, t.name AS name, t.trade AS trade ORDER BY t.name`,
    { id },
  );
  const technicians: Technician[] = techResult.records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    trade: r.get("trade"),
  }));

  return { equipment, downstream, parts, technicians };
}

// QUERY 2 — parts fitted to more than one machine.
export async function getSharedParts(): Promise<SharedPart[]> {
  const { records } = await getDriver().executeQuery(
    `MATCH (e:Equipment)-[:HAS_PART]->(p:Part)
     WITH p, collect({id: e.id, name: e.name}) AS machines
     WHERE size(machines) > 1
     RETURN p.id AS id, p.name AS name, machines, size(machines) AS machineCount
     ORDER BY machineCount DESC, p.name`,
  );
  return records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    machines: r.get("machines"),
    machineCount: r.get("machineCount").toNumber(),
  }));
}

// QUERY 3 — every machine ranked by how many others it takes down.
export async function getCriticality(): Promise<CriticalityRow[]> {
  const { records } = await getDriver().executeQuery(
    `MATCH (e:Equipment)
     OPTIONAL MATCH (e)-[:FEEDS*1..${MAX_DEPTH}]->(d:Equipment)
     WITH e, count(DISTINCT d) AS impact
     RETURN e.id AS id, e.name AS name, e.location AS location, impact
     ORDER BY impact DESC, e.name`,
  );
  return records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    location: r.get("location"),
    impact: r.get("impact").toNumber(),
  }));
}

export async function getFeedEdges(): Promise<[string, string][]> {
  const { records } = await getDriver().executeQuery(
    `MATCH (a:Equipment)-[:FEEDS]->(b:Equipment)
     RETURN a.id AS from, b.id AS to`,
  );
  return records.map((r) => [r.get("from"), r.get("to")]);
}
