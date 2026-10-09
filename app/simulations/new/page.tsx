
"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeProps,
  type Edge,
  type Connection,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

type NodeType =
  | "warehouse"
  | "order-source"
  | "vehicle-pool"
  | "customer"
  | "queue";

interface SimulationNodeData extends Record<string, unknown> {
  nodeType: NodeType;
  name: string;
  capacity: number;
  processingTime: number;
  quantity: number;
}

type SimNode = Node<SimulationNodeData, "simNode">;

const STORAGE_KEY = "simulens-model-v1";

const componentTypes: {
  type: NodeType;
  label: string;
  icon: string;
}[] = [
  { type: "warehouse", label: "Warehouse", icon: "📦" },
  { type: "order-source", label: "Order Source", icon: "📋" },
  { type: "vehicle-pool", label: "Vehicle Pool", icon: "🚚" },
  { type: "customer", label: "Customer", icon: "👥" },
  { type: "queue", label: "Queue", icon: "⏳" },
];

function SimulationNodeCard({ data, selected }: NodeProps<SimNode>) {
  const component = componentTypes.find(
    (item) => item.type === data.nodeType
  );

  return (
    <div
      className={`min-w-[190px] rounded-xl border bg-slate-900 p-4 text-white shadow-xl ${
        selected ? "border-blue-400" : "border-slate-700"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-blue-400"
      />

      <div className="flex items-center gap-3">
        <span className="text-2xl">{component?.icon}</span>
        <div>
          <p className="font-semibold">{data.name}</p>
          <p className="text-xs text-slate-400">{data.nodeType}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-slate-300">
        <p>Capacity: {data.capacity}</p>
        <p>Processing: {data.processingTime} min</p>
        <p>Quantity: {data.quantity}</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-950 !bg-purple-400"
      />
    </div>
  );
}

const nodeTypes = {
  simNode: SimulationNodeCard,
};

export default function NewSimulation() {
  const [nodes, setNodes, onNodesChange] = useNodesState<SimNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      if (connection.source === connection.target) {
        setMessage("A node cannot connect to itself.");
        return;
      }

      const exists = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target
      );

      if (exists) {
        setMessage("This connection already exists.");
        return;
      }

      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            type: "smoothstep",
            animated: true,
            style: { stroke: "#60a5fa", strokeWidth: 2 },
          },
          current
        )
      );

      setMessage("Connection created successfully.");
    },
    [edges, setEdges]
  );

  const addNode = (type: NodeType) => {
    const component = componentTypes.find((item) => item.type === type);
    if (!component) return;

    const id = crypto.randomUUID();

    const newNode: SimNode = {
      id,
      type: "simNode",
      position: {
        x: 100 + (nodes.length % 3) * 240,
        y: 100 + Math.floor(nodes.length / 3) * 190,
      },
      data: {
        nodeType: type,
        name: component.label,
        capacity: 100,
        processingTime: 10,
        quantity: 1,
      },
    };

    setNodes((current) => [...current, newNode]);
    setSelectedNodeId(id);
    setMessage("");
  };

  const updateNode = (
    field: keyof SimulationNodeData,
    value: string | number
  ) => {
    if (!selectedNodeId) return;

    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: { ...node.data, [field]: value },
            }
          : node
      )
    );
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;

    setNodes((current) =>
      current.filter((node) => node.id !== selectedNodeId)
    );

    setEdges((current) =>
      current.filter(
        (edge) =>
          edge.source !== selectedNodeId &&
          edge.target !== selectedNodeId
      )
    );

    setSelectedNodeId(null);
    setMessage("Node and its connections deleted.");
  };

  const saveModel = () => {
    try {
      const model = {
        version: 1,
        nodes,
        edges,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      setMessage("Model saved successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Could not save the model.");
    }
  };

  const loadModel = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setMessage("No saved model found.");
        return;
      }

      const model = JSON.parse(saved);

      if (
        model.version !== 1 ||
        !Array.isArray(model.nodes) ||
        !Array.isArray(model.edges)
      ) {
        setMessage("Invalid saved model.");
        return;
      }

      const ids = new Set<string>(
        model.nodes.map((node: SimNode) => node.id)
      );

      const validNodes = model.nodes.filter(
        (node: SimNode) =>
          node &&
          typeof node.id === "string" &&
          node.data &&
          componentTypes.some(
            (item) => item.type === node.data.nodeType
          ) &&
          typeof node.data.name === "string" &&
          typeof node.position?.x === "number" &&
          typeof node.position?.y === "number" &&
          Number.isFinite(node.data.capacity) &&
          Number.isFinite(node.data.processingTime) &&
          Number.isFinite(node.data.quantity)
      ) as SimNode[];

      const validIds = new Set(validNodes.map((node) => node.id));

      const validEdges = model.edges.filter(
        (edge: Edge) =>
          edge &&
          typeof edge.id === "string" &&
          typeof edge.source === "string" &&
          typeof edge.target === "string" &&
          edge.source !== edge.target &&
          validIds.has(edge.source) &&
          validIds.has(edge.target)
      );

      setNodes(validNodes);
      setEdges(validEdges);
      setSelectedNodeId(null);
      setMessage("Model loaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Could not load the saved model.");
    }
  };

  const selectedNode = nodes.find(
    (node) => node.id === selectedNodeId
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">SimuLens</h1>
          <p className="text-sm text-slate-400">
            Visual System Builder
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadModel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Load Model
          </button>

          <button
            onClick={saveModel}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500"
          >
            Save Model
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-81px)] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        {/* Components */}
        <aside className="border-b border-slate-800 p-4 lg:border-b-0 lg:border-r">
          <h2 className="mb-4 font-semibold">Components</h2>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {componentTypes.map((component) => (
              <button
                key={component.type}
                onClick={() => addNode(component.type)}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-left hover:border-blue-500"
              >
                <span className="text-xl">{component.icon}</span>
                <span className="text-sm">{component.label}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Add a component, then drag it into position on the canvas.
          </p>
        </aside>

        {/* Visual Canvas */}
        <section className="min-w-0 p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap justify-between gap-2">
            <h2 className="font-semibold">Simulation Canvas</h2>
            <span className="text-xs text-slate-400">
              {nodes.length} nodes · {edges.length} connections
            </span>
          </div>

          <div className="h-[600px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:h-[700px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              deleteKeyCode={["Backspace", "Delete"]}
              defaultEdgeOptions={{
                type: "smoothstep",
                animated: true,
                style: { stroke: "#60a5fa", strokeWidth: 2 },
              }}
            >
              <Background color="#334155" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#334155"
                maskColor="rgba(2, 6, 23, 0.65)"
              />
            </ReactFlow>
          </div>

          {message && (
            <p className="mt-3 text-sm text-blue-300" role="status">
              {message}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Drag from a node's right handle to another node's left
            handle to create a connection.
          </p>
        </section>

        {/* Properties */}
        <aside className="border-t border-slate-800 p-4 lg:border-l lg:border-t-0">
          <h2 className="mb-4 font-semibold">Properties</h2>

          {!selectedNode ? (
            <p className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
              Select a node on the canvas to edit its properties.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Name
                </label>
                <input
                  value={selectedNode.data.name}
                  onChange={(event) =>
                    updateNode("name", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {(
                [
                  ["capacity", "Capacity"],
                  ["processingTime", "Processing Time (min)"],
                  ["quantity", "Quantity"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-slate-400">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={selectedNode.data[field]}
                    onChange={(event) =>
                      updateNode(
                        field,
                        Math.max(0, Number(event.target.value))
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              <button
                onClick={deleteNode}
                className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
              >
                Delete Node
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
