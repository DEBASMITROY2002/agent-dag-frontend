import React from "react";
import { Handle, Position, MarkerType, NodeProps } from "@reactflow/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const renderMarkdownWithLineBreaks = (text: string) =>
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text.replace(/\\n/g, "\n")}</ReactMarkdown>;

// CustomNode component
export const CustomNode = (props: NodeProps) => {
  const { data, id } = props;
  const { node, onRun, setEditNode, handleDeleteNode, onView, onDuplicate } = data;
  return (
    <div className="graph-node-card">
      {/* Top handle for incoming/outgoing edges */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: "#232946", width: 12, height: 12, top: -8 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: "#eebbc3", width: 12, height: 12, top: -8, left: 20 }}
        isConnectable={true}
      />
      {/* Bottom handle for incoming/outgoing edges */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: "#232946", width: 12, height: 12, bottom: -8 }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: "#eebbc3", width: 12, height: 12, bottom: -8, left: 20 }}
        isConnectable={true}
      />
      <div className="graph-node-header">
        <span className="graph-node-title">{node.nodeName}</span>
        <span className={`graph-node-status ${node.status}`}>{node.status}</span>
        <span style={{ marginLeft: 8 }}>
          {node._compiled ? (
            <span style={{ color: "green" }}>Compiled</span>
          ) : (
            <span style={{ color: "red" }}>Not Compiled</span>
          )}
        </span>
      </div>
      <div className="graph-node-body">
        <div><b>ID:</b> {node.id}</div>
        {node.userPrompt && (
          <div>
            <b>User Prompt:</b>
            <div
              style={{
                maxHeight: 60,
                overflowY: "auto",
                background: "#f6f6f6",
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 4,
                fontSize: "0.95em",
              }}
            >
              {renderMarkdownWithLineBreaks(String(node.userPrompt))}
            </div>
          </div>
        )}
        {node.systemInstructions && (
          <div>
            <b>System:</b>
            <div
              style={{
                maxHeight: 60,
                overflowY: "auto",
                background: "#f6f6f6",
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 4,
                fontSize: "0.95em",
              }}
            >
              {renderMarkdownWithLineBreaks(String(node.systemInstructions))}
            </div>
          </div>
        )}
        {node.kwargs && Object.keys(node.kwargs).length > 0 && (
          <div>
            <b>Kwargs:</b>
            <pre
              style={{
                maxHeight: 60,
                overflowY: "auto",
                background: "#f6f6f6",
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 4,
                fontSize: "0.95em",
              }}
            >{JSON.stringify(node.kwargs, null, 2)}</pre>
          </div>
        )}
        {node.outputSchema && (
          <div>
            <b>Output Schema:</b>
            <pre
              style={{
                maxHeight: 60,
                overflowY: "auto",
                background: "#f6f6f6",
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 4,
                fontSize: "0.95em",
              }}
            >{JSON.stringify(node.outputSchema, null, 2)}</pre>
          </div>
        )}
        {node._outputs && (
          <div>
            <b>Outputs:</b>
            <pre
              style={{
                maxHeight: 60,
                overflowY: "auto",
                background: "#f6f6f6",
                borderRadius: 4,
                padding: "2px 4px",
                marginBottom: 4,
                fontSize: "0.95em",
              }}
            >{JSON.stringify(node._outputs, null, 2)}</pre>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="run-node-btn" onClick={(e) => { e.stopPropagation(); onRun(node.nodeName); }}>
          ▶ Run
        </button>
        {onView && (
          <button
            className="view-node-btn"
            onClick={(e) => { e.stopPropagation(); onView(node); }}
            style={{ background: "#b3e6ff", color: "#232946" }}
          >
            👁️ View
          </button>
        )}
        {setEditNode && (
          <button
            className="update-node-btn"
            onClick={(e) => { e.stopPropagation(); setEditNode(node); }}
            style={{ background: "#ffd966", color: "#232946" }}
          >
            ✏️ Update
          </button>
        )}
        {handleDeleteNode && (
          <button
            className="delete-node-btn"
            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.nodeName); }}
            style={{ background: "#ff4d4f", color: "#fff" }}
          >
            🗑️ Delete
          </button>
        )}
        {onDuplicate && (
          <button
            className="duplicate-node-btn"
            onClick={(e) => { e.stopPropagation(); onDuplicate(node); }}
            style={{ background: "#e0e0e0", color: "#232946" }}
            title="Duplicate Node"
          >
            ⧉ Duplicate
          </button>
        )}
      </div>
    </div>
  );
};

// convertGraphToReactFlow utility
export function convertGraphToReactFlow(
  nodesObj: any,
  handleRunNode: (nodeId: string) => void,
  setEditNode?: (node: any) => void,
  handleDeleteNode?: (nodeName: string) => void,
  onView?: (node: any) => void,
  onDuplicate?: (node: any) => void // <-- add this
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Build adjacency list and parent count
  const adjacencyList: Record<string, string[]> = {};
  const parentCount: Record<string, number> = {};
  Object.keys(nodesObj).forEach((nodeName) => {
    adjacencyList[nodeName] = [];
    parentCount[nodeName] = 0;
  });
  for (const [nodeName, node] of Object.entries(nodesObj)) {
    const n: any = node;
    if (Array.isArray(n._children)) {
      n._children.forEach((child: string) => {
        if (adjacencyList[nodeName] && parentCount[child] !== undefined) {
          adjacencyList[nodeName].push(child);
          parentCount[child]++;
        }
      });
    }
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  Object.entries(parentCount).forEach(([nodeName, count]) => {
    if (count === 0) queue.push(nodeName);
  });
  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    topoOrder.push(node);
    adjacencyList[node].forEach((child) => {
      parentCount[child]--;
      if (parentCount[child] === 0) queue.push(child);
    });
  }
  const order = topoOrder.length ? topoOrder : Object.keys(nodesObj);

  // Get node card width and horizontal/vertical spacing adaptively
  const nodeCardWidth = 280; // should match the width in CustomNode
  const nodeCardHeight = 80; // minHeight in CustomNode
  const xSpacing = nodeCardWidth + nodeCardWidth * 1; // 20% of width as gap
  const ySpacing = nodeCardHeight + nodeCardHeight * 1; // 20% of height as gap
  const startX = 100;
  const startY = 100;
  const nodePositions: Record<string, { x: number; y: number }> = {};

  order.forEach((nodeName, idx) => {
    const x = startX + idx * xSpacing;
    const y = startY + idx * ySpacing;
    nodePositions[nodeName] = { x, y };
  });

  // Alternate edge handles: even index = top-to-top, odd index = bottom-to-bottom
  const colorPalette = [
    "#2a9d8f", // teal
    "#e76f51", // red
    "#f4a261", // orange
    "#264653", // dark blue
    "#e9c46a", // yellow
    "#a259f7", // purple
    "#43aa8b", // green
    "#f3722c", // orange-red
    "#457b9d", // blue
    "#b5838d", // pink
  ];

  for (const [nodeName, node] of Object.entries(nodesObj)) {
    nodes.push({
      id: nodeName,
      type: "customNode",
      position: nodePositions[nodeName] || { x: 0, y: 0 },
      data: { node, onRun: handleRunNode, setEditNode, handleDeleteNode, onView, onDuplicate },
      draggable: true,
      selectable: true,
    });
    const n: any = node;
    if (Array.isArray(n._children)) {
      n._children.forEach((child: string) => {
        const sourceIdx = order.indexOf(nodeName);
        // Alternate: even = top-to-top, odd = bottom-to-bottom
        const isEven = sourceIdx % 2 === 0;
        // Pick color based on sourceIdx for more variety
        const color = colorPalette[sourceIdx % colorPalette.length];
        edges.push({
          id: `${nodeName}->${child}`,
          source: nodeName,
          target: child,
          sourceHandle: isEven ? "top" : "bottom",
          targetHandle: isEven ? "top" : "bottom",
          animated: true,
          style: {
            stroke: color,
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: 24,
            height: 24,
          },
        });
      });
    }
  }

  return { nodes, edges };
}
