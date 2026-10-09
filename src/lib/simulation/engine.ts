
import type { Edge } from "@xyflow/react";

// The component types supported by our existing visual editor.
export type SimulationNodeType =
  | "warehouse"
  | "order-source"
  | "vehicle-pool"
  | "customer"
  | "queue";

// Data stored inside each React Flow node.
export interface SimulationNodeData {
  nodeType: SimulationNodeType;
  name: string;
  capacity: number;
  processingTime: number;
  quantity: number;
}

// Minimal node structure required by the engine.
// We do not need React Flow's rendering or position properties.
export interface SimulationNode {
  id: string;
  data: SimulationNodeData;
}

// A connection between two components.
export type SimulationConnection = Pick<
  Edge,
  "id" | "source" | "target"
>;

// Complete input accepted by the simulation engine.
export interface SimulationConfig {
  nodes: SimulationNode[];
  edges: SimulationConnection[];
  durationMinutes: number;
}

// Metrics produced by a simulation run.
export interface SimulationMetrics {
  totalOrders: number;
  completedDeliveries: number;
  averageWaitingTimeMinutes: number;
  maxQueueLength: number;
  vehicleUtilizationPercent: number;
}

// Result returned after the engine finishes.
export interface SimulationResult {
  success: boolean;
  durationMinutes: number;
  metrics: SimulationMetrics;
  errors: string[];
  warnings: string[];
}


const VALID_NODE_TYPES = new Set<SimulationNodeType>([
  "warehouse",
  "order-source",
  "vehicle-pool",
  "customer",
  "queue",
]);

export function validateSimulationConfig(
  config: SimulationConfig,
): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(config.durationMinutes) ||
      config.durationMinutes <= 0) {
    errors.push("Simulation duration must be greater than zero.");
  }

  if (!Array.isArray(config.nodes) || config.nodes.length === 0) {
    errors.push("At least one simulation node is required.");
    return errors;
  }

  if (!Array.isArray(config.edges)) {
    errors.push("Simulation connections must be an array.");
    return errors;
  }

  const nodeIds = new Set<string>();

  for (const node of config.nodes) {
    if (!node || typeof node.id !== "string" || !node.id.trim()) {
      errors.push("Every node must have a valid ID.");
      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }

    nodeIds.add(node.id);

    if (!node.data || !VALID_NODE_TYPES.has(node.data.nodeType)) {
      errors.push(`Node ${node.id} has an unsupported type.`);
      continue;
    }

    if (!node.data.name.trim()) {
      errors.push(`Node ${node.id} must have a name.`);
    }

    for (const field of [
      "capacity",
      "processingTime",
      "quantity",
    ] as const) {
      const value = node.data[field];

      if (!Number.isFinite(value) || value < 0) {
        errors.push(
          `Node "${node.data.name}" has an invalid ${field}.`,
        );
      }
    }

    if (
      node.data.nodeType === "order-source" &&
      node.data.processingTime <= 0
    ) {
      errors.push(
        `Order Source "${node.data.name}" needs a positive arrival interval.`,
      );
    }

    if (
      node.data.nodeType === "warehouse" &&
      node.data.processingTime <= 0
    ) {
      errors.push(
        `Warehouse "${node.data.name}" needs a positive processing time.`,
      );
    }

    if (
      node.data.nodeType === "vehicle-pool" &&
      node.data.capacity < 1
    ) {
      errors.push(
        `Vehicle Pool "${node.data.name}" needs at least one vehicle.`,
      );
    }
  }

  const edgeIds = new Set<string>();

  for (const edge of config.edges) {
    if (!edge || typeof edge.id !== "string" ||
        typeof edge.source !== "string" ||
        typeof edge.target !== "string") {
      errors.push("A connection has invalid fields.");
      continue;
    }

    if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate connection ID: ${edge.id}`);
    }

    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Connection "${edge.id}" references a missing node.`);
    }

    if (edge.source === edge.target) {
      errors.push(`Connection "${edge.id}" cannot connect a node to itself.`);
    }
  }

  return errors;
}



export interface GraphAnalysis {
  nodeCount: number;
  connectionCount: number;
  disconnectedNodeIds: string[];
  sourceNodeIds: string[];
  destinationNodeIds: string[];
  hasCycle: boolean;
}

export function analyzeSimulationGraph(
  config: SimulationConfig
): GraphAnalysis {
  const nodeIds = new Set(config.nodes.map((node) => node.id));

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    incoming.set(id, 0);
    outgoing.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of config.edges) {
    if (
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target) ||
      edge.source === edge.target
    ) {
      continue;
    }

    outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);

    adjacency.get(edge.source)?.push(edge.target);
  }

  const disconnectedNodeIds = [...nodeIds].filter(
    (id) =>
      (incoming.get(id) ?? 0) === 0 &&
      (outgoing.get(id) ?? 0) === 0
  );

  const sourceNodeIds = [...nodeIds].filter(
    (id) => (incoming.get(id) ?? 0) === 0
  );

  const destinationNodeIds = [...nodeIds].filter(
    (id) => (outgoing.get(id) ?? 0) === 0
  );

  // Detect cycles using depth-first search.
  const visited = new Set<string>();
  const activePath = new Set<string>();
  let hasCycle = false;

  function visit(nodeId: string): void {
    if (hasCycle) return;

    visited.add(nodeId);
    activePath.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      if (activePath.has(neighbor)) {
        hasCycle = true;
        return;
      }

      if (!visited.has(neighbor)) {
        visit(neighbor);
      }

      if (hasCycle) return;
    }

    activePath.delete(nodeId);
  }

  for (const id of nodeIds) {
    if (!visited.has(id)) {
      visit(id);
    }

    if (hasCycle) break;
  }

  return {
    nodeCount: config.nodes.length,
    connectionCount: config.edges.length,
    disconnectedNodeIds,
    sourceNodeIds,
    destinationNodeIds,
    hasCycle,
  };
}



export function prepareSimulationConfig(
  nodes: Array<{
    id: string;
    data: SimulationNodeData;
  }>,
  edges: SimulationConnection[],
  durationMinutes: number
): SimulationConfig {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      data: {
        nodeType: node.data.nodeType,
        name: node.data.name,
        capacity: node.data.capacity,
        processingTime: node.data.processingTime,
        quantity: node.data.quantity,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
    durationMinutes,
  };
}




export interface SimulationReadiness {
  ready: boolean;
  errors: string[];
  warnings: string[];
}

export function checkSimulationReadiness(
  config: SimulationConfig
): SimulationReadiness {
  const errors = validateSimulationConfig(config);
  const warnings: string[] = [];

  if (errors.length > 0) {
    return { ready: false, errors, warnings };
  }

  const graph = analyzeSimulationGraph(config);

  if (graph.disconnectedNodeIds.length > 0) {
    warnings.push(
      `${graph.disconnectedNodeIds.length} disconnected node(s) will not participate in the flow.`
    );
  }

  if (graph.sourceNodeIds.length === 0) {
    errors.push("The graph needs at least one source node.");
  }

  if (graph.destinationNodeIds.length === 0) {
    errors.push("The graph needs at least one destination node.");
  }

  if (graph.hasCycle) {
    warnings.push(
      "The graph contains a cycle. Cycle handling must be supported by the simulation runner."
    );
  }

  if (
    !config.nodes.some((node) => node.data.nodeType === "order-source")
  ) {
    errors.push("Add at least one Order Source to generate orders.");
  }

  if (
    !config.nodes.some((node) => node.data.nodeType === "customer")
  ) {
    errors.push("Add at least one Customer node as a delivery destination.");
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
  };
}



export function runSimulation(
  config: SimulationConfig
): SimulationResult {
  const errors = validateSimulationConfig(config);
  const emptyMetrics: SimulationMetrics = {
    totalOrders: 0,
    completedDeliveries: 0,
    averageWaitingTimeMinutes: 0,
    maxQueueLength: 0,
    vehicleUtilizationPercent: 0,
  };

  if (errors.length > 0) {
    return {
      success: false,
      durationMinutes: config.durationMinutes,
      metrics: emptyMetrics,
      errors,
      warnings: [],
    };
  }

  const graph = analyzeSimulationGraph(config);
  const warnings: string[] = [];

  if (graph.hasCycle) {
    return {
      success: false,
      durationMinutes: config.durationMinutes,
      metrics: emptyMetrics,
      errors: [
        "The first simulation runner does not support cyclic graphs yet.",
      ],
      warnings,
    };
  }

  const findNode = (type: SimulationNodeType) =>
    config.nodes.find((node) => node.data.nodeType === type);

  const source = findNode("order-source");
  const warehouse = findNode("warehouse");
  const vehiclePool = findNode("vehicle-pool");
  const customer = findNode("customer");

  if (!source || !warehouse || !vehiclePool || !customer) {
    return {
      success: false,
      durationMinutes: config.durationMinutes,
      metrics: emptyMetrics,
      errors: [
        "The first runner requires an Order Source, Warehouse, Vehicle Pool, and Customer.",
      ],
      warnings,
    };
  }

  // Require a connected, directed route through the required stages.
 
  // Require a connected, directed route through the required stages.
  const reachableFrom = (startId: string): Set<string> => {
    const reached = new Set<string>([startId]);
    const stack = [startId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      for (const edge of config.edges) {
        if (edge.source === current && !reached.has(edge.target)) {
          reached.add(edge.target);
          stack.push(edge.target);
        }
      }
    }

    return reached;
  };


  const sourceReachable = reachableFrom(source.id);
  const warehouseReachable = reachableFrom(warehouse.id);
  const vehicleReachable = reachableFrom(vehiclePool.id);

  if (
    !sourceReachable.has(warehouse.id) ||
    !warehouseReachable.has(vehiclePool.id) ||
    !vehicleReachable.has(customer.id)
  ) {
    return {
      success: false,
      durationMinutes: config.durationMinutes,
      metrics: emptyMetrics,
      errors: [
        "Connect the stages in this order: Order Source → Warehouse → Vehicle Pool → Customer.",
      ],
      warnings,
    };
  }

  // First-version model: one warehouse processing station and
  // a fleet of identical vehicles.
  const arrivalInterval = source.data.processingTime;
  const warehouseServiceTime = warehouse.data.processingTime;
  const deliveryTime = vehiclePool.data.processingTime;
  const vehicleCount = Math.floor(vehiclePool.data.capacity);

  if (
    arrivalInterval <= 0 ||
    warehouseServiceTime <= 0 ||
    deliveryTime <= 0 ||
    vehicleCount < 1
  ) {
    return {
      success: false,
      durationMinutes: config.durationMinutes,
      metrics: emptyMetrics,
      errors: [
        "Arrival interval, warehouse processing time, delivery time, and vehicle count must be positive.",
      ],
      warnings,
    };
  }

  const arrivals: number[] = [];

  for (
    let time = 0;
    time < config.durationMinutes;
    time += arrivalInterval
  ) {
    arrivals.push(time);
  }

  let warehouseAvailableAt = 0;
  const vehicleAvailableAt = Array<number>(vehicleCount).fill(0);
  let totalWaitingTime = 0;
  let maxQueueLength = 0;
  let completedDeliveries = 0;
  let totalVehicleBusyTime = 0;

  const warehouseFinishTimes: number[] = [];

  for (const arrivalTime of arrivals) {
    const warehouseStart = Math.max(
      arrivalTime,
      warehouseAvailableAt
    );

    totalWaitingTime += warehouseStart - arrivalTime;

    warehouseAvailableAt = warehouseStart + warehouseServiceTime;
    warehouseFinishTimes.push(warehouseAvailableAt);

    const queueLength = warehouseFinishTimes.filter(
      (finishTime) => finishTime > arrivalTime
    ).length;

    maxQueueLength = Math.max(maxQueueLength, queueLength);
  }

  for (const warehouseFinish of warehouseFinishTimes) {
    let earliestVehicleIndex = 0;

    for (let i = 1; i < vehicleAvailableAt.length; i++) {
      if (
        vehicleAvailableAt[i] <
        vehicleAvailableAt[earliestVehicleIndex]
      ) {
        earliestVehicleIndex = i;
      }
    }

    const vehicleStart = Math.max(
      warehouseFinish,
      vehicleAvailableAt[earliestVehicleIndex]
    );

    totalWaitingTime += vehicleStart - warehouseFinish;

    vehicleAvailableAt[earliestVehicleIndex] =
      vehicleStart + deliveryTime;

    totalVehicleBusyTime += deliveryTime;

    if (
      vehicleAvailableAt[earliestVehicleIndex] <=
      config.durationMinutes
    ) {
      completedDeliveries++;
    }
  }

  const averageWaitingTimeMinutes =
    arrivals.length === 0
      ? 0
      : totalWaitingTime / arrivals.length;

  const vehicleUtilizationPercent =
    config.durationMinutes <= 0 || vehicleCount === 0
      ? 0
      : Math.min(
          100,
          (totalVehicleBusyTime /
            (config.durationMinutes * vehicleCount)) *
            100
        );

  if (completedDeliveries < arrivals.length) {
    warnings.push(
      `${arrivals.length - completedDeliveries} order(s) were not delivered within the simulation duration.`
    );
  }

  return {
    success: true,
    durationMinutes: config.durationMinutes,
    metrics: {
      totalOrders: arrivals.length,
      completedDeliveries,
      averageWaitingTimeMinutes,
      maxQueueLength,
      vehicleUtilizationPercent,
    },
    errors: [],
    warnings,
  };
}
