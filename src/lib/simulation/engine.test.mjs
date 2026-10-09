

import { runSimulation } from "./engine.ts";
import { checkSimulationReadiness } from "./engine.ts";
import { prepareSimulationConfig } from "./engine.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSimulationGraph } from "./engine.ts";

const nodes = [
  { id: "orders", data: { nodeType: "order-source" } },
  { id: "warehouse", data: { nodeType: "warehouse" } },
  { id: "customer", data: { nodeType: "customer" } },
  { id: "unused", data: { nodeType: "queue" } },
];

function config(edges) {
  return {
    nodes,
    edges,
    durationMinutes: 60,
  };
}

test("identifies source, destination, and disconnected nodes", () => {
  const result = analyzeSimulationGraph(
    config([
      { id: "e1", source: "orders", target: "warehouse" },
      { id: "e2", source: "warehouse", target: "customer" },
    ])
  );

  assert.deepEqual(result.sourceNodeIds, ["orders", "unused"]);
  assert.deepEqual(result.destinationNodeIds, ["customer", "unused"]);
  assert.deepEqual(result.disconnectedNodeIds, ["unused"]);
  assert.equal(result.nodeCount, 4);
  assert.equal(result.connectionCount, 2);
  assert.equal(result.hasCycle, false);
});

test("detects a cycle in the graph", () => {
  const result = analyzeSimulationGraph(
    config([
      { id: "e1", source: "orders", target: "warehouse" },
      { id: "e2", source: "warehouse", target: "customer" },
      { id: "e3", source: "customer", target: "orders" },
    ])
  );

  assert.equal(result.hasCycle, true);
});

test("handles a graph without connections", () => {
  const result = analyzeSimulationGraph(config([]));

  assert.equal(result.connectionCount, 0);
  assert.equal(result.hasCycle, false);
  assert.equal(result.disconnectedNodeIds.length, 4);
});




test("prepares canvas nodes and edges for the simulation engine", () => {
  const canvasNodes = [
    {
      id: "warehouse-1",
      data: {
        nodeType: "warehouse",
        name: "Main Warehouse",
        capacity: 50,
        processingTime: 5,
        quantity: 2,
      },
    },
  ];

  const canvasEdges = [
    {
      id: "edge-1",
      source: "warehouse-1",
      target: "customer-1",
    },
  ];

  const result = prepareSimulationConfig(
    canvasNodes,
    canvasEdges,
    60
  );

  assert.equal(result.durationMinutes, 60);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.nodes[0].data.name, "Main Warehouse");
  assert.equal(result.nodes[0].data.capacity, 50);
  assert.deepEqual(result.edges, [
    {
      id: "edge-1",
      source: "warehouse-1",
      target: "customer-1",
    },
  ]);
});




test("marks a valid order-to-customer flow as ready", () => {
  const validConfig = {
    nodes: [
      {
        id: "orders",
        data: {
          nodeType: "order-source",
          name: "Orders",
          capacity: 100,
          processingTime: 5,
          quantity: 1,
        },
      },
      {
        id: "warehouse",
        data: {
          nodeType: "warehouse",
          name: "Warehouse",
          capacity: 100,
          processingTime: 10,
          quantity: 1,
        },
      },
      {
        id: "customer",
        data: {
          nodeType: "customer",
          name: "Customer",
          capacity: 100,
          processingTime: 1,
          quantity: 1,
        },
      },
    ],
    edges: [
      { id: "e1", source: "orders", target: "warehouse" },
      { id: "e2", source: "warehouse", target: "customer" },
    ],
    durationMinutes: 60,
  };

  const result = checkSimulationReadiness(validConfig);

  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
});

test("rejects a configuration without an Order Source", () => {
  const configWithoutSource = {
    nodes: [
      {
        id: "customer",
        data: {
          nodeType: "customer",
          name: "Customer",
          capacity: 100,
          processingTime: 1,
          quantity: 1,
        },
      },
    ],
    edges: [],
    durationMinutes: 60,
  };

  const result = checkSimulationReadiness(configWithoutSource);

  assert.equal(result.ready, false);
  assert.ok(result.errors.length > 0);
});




test("simulates orders and calculates delivery metrics", () => {
  const config = {
    nodes: [
      {
        id: "orders",
        data: {
          nodeType: "order-source",
          name: "Orders",
          capacity: 100,
          processingTime: 10,
          quantity: 1,
        },
      },
      {
        id: "warehouse",
        data: {
          nodeType: "warehouse",
          name: "Warehouse",
          capacity: 100,
          processingTime: 5,
          quantity: 1,
        },
      },
      {
        id: "vehicles",
        data: {
          nodeType: "vehicle-pool",
          name: "Vehicles",
          capacity: 1,
          processingTime: 5,
          quantity: 1,
        },
      },
      {
        id: "customer",
        data: {
          nodeType: "customer",
          name: "Customer",
          capacity: 100,
          processingTime: 1,
          quantity: 1,
        },
      },
    ],
    edges: [
      { id: "e1", source: "orders", target: "warehouse" },
      { id: "e2", source: "warehouse", target: "vehicles" },
      { id: "e3", source: "vehicles", target: "customer" },
    ],
    durationMinutes: 60,
  };

  const result = runSimulation(config);

  assert.equal(result.success, true);
  assert.equal(result.metrics.totalOrders, 6);
  assert.equal(result.metrics.completedDeliveries, 6);
  assert.equal(result.metrics.averageWaitingTimeMinutes, 0);
  assert.equal(result.metrics.vehicleUtilizationPercent, 50);
  assert.deepEqual(result.errors, []);
});
