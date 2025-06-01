import React, { useEffect, useState, useCallback } from "react";
import { ReactFlow } from "@reactflow/core";
import { Background } from "@reactflow/background";
import { Controls } from "@reactflow/controls";
import { MiniMap } from "@reactflow/minimap";
import NodeEditModal from "../components/NodeEditModal";
import ViewNodeModal from "../components/ViewNodeModal";
import "@reactflow/core/dist/style.css";
import { CustomNode, convertGraphToReactFlow } from "../utils/GraphUtils";
import { handleDeleteNodeUtil, handleAddNodeUtil } from "../utils/NodeHandlerUtils";
import { API_BASE_URL } from "../App";

interface GraphAreaProps {
  selectedSession: string | null;
  handleCompileSession: () => void;
  handleRunNode: (nodeId: string) => void;
  showPopup: boolean;
  setShowPopup: (v: boolean) => void;
  setPopupMsg: (msg: string) => void;
  setPopupError: (v: boolean) => void;
}

const GraphArea: React.FC<GraphAreaProps> = ({
  selectedSession,
  handleCompileSession,
  handleRunNode,
  showPopup,
  setShowPopup,
  setPopupMsg,
  setPopupError,
}) => {
  const [graph, setGraph] = useState<any>(null);
  const [rfNodes, setRfNodes] = useState<any[]>([]);
  const [rfEdges, setRfEdges] = useState<any[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [editNode, setEditNode] = useState<any>(null);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [viewNode, setViewNode] = useState<any>(null);
  const [duplicateNode, setDuplicateNode] = useState<any>(null);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgInput, setPkgInput] = useState("");
  const [pkgLoading, setPkgLoading] = useState(false);

  // Define handlers using useCallback to ensure they're stable
  const handleDeleteNode = useCallback(
    (nodeName: string) =>
      handleDeleteNodeUtil({
        nodeName,
        selectedSession,
        setPopupMsg,
        setPopupError,
        setShowPopup,
        setGraph,
        setRfNodes,
        setRfEdges,
        handleRunNode,
        setEditNode,
      }),
    [selectedSession, handleRunNode]
  );

  const handleAddNode = useCallback(
    (nodeData: any) =>
      handleAddNodeUtil({
        nodeData,
        selectedSession,
        setPopupMsg,
        setPopupError,
        setShowPopup,
        setAddNodeModalOpen,
        setGraph,
        setRfNodes,
        setRfEdges,
        handleRunNode,
        setEditNode,
      }),
    [selectedSession, handleRunNode]
  );

  // Duplicate node handler
  const handleDuplicateNode = async (node: any) => {
    const newName = window.prompt("Enter new node name for duplicate:", node.nodeName + "_copy");
    if (!newName) return;
    // Prepare node data for duplication (copy all properties except nodeName/id/status/_compiled/_outputs/_children)
    const {
      nodeName, id, status, _compiled, _outputs, _children, ...rest
    } = node;
    // Copy all relevant fields
    const nodeData = {
      node_name: newName,
      system_instructions: node.systemInstructions,
      user_prompt: node.userPrompt,
      python_code: node.pythonCode,
      output_schema: node.outputSchema,
      use_LLM: node.use_LLM !== undefined ? node.use_LLM : node.useLLM,
      json_mode: node.json_mode !== undefined ? node.json_mode : node.jsonMode,
      tool_name: node.tool_name !== undefined ? node.tool_name : node.toolName,
      tool_description: node.tool_description !== undefined ? node.tool_description : node.toolDescription,
      kwargs: node.kwargs,
      // If you want to duplicate children, add _children: [...(_children || [])]
    };
    try {
      const res = await fetch(`${API_BASE_URL}/add-node`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSession,
          ...nodeData,
        }),
      });
      if (res.status === 200) {
        setPopupMsg("Node duplicated successfully!");
        setPopupError(false);
        setShowPopup(true);
        // Refresh graph
        fetch(`${API_BASE_URL}/get-session-graph`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: selectedSession }),
        })
          .then((res) => res.json())
          .then((data) => {
            setGraph(data.graph);
            const { nodes, edges } = convertGraphToReactFlow(
              data.graph?.nodes || {},
              handleRunNode,
              setEditNode,
              handleDeleteNode,
              setViewNode,
              handleDuplicateNode
            );
            setRfNodes(nodes);
            setRfEdges(edges);
          });
      } else {
        const err = await res.text();
        setPopupMsg("Error: " + err);
        setPopupError(true);
        setShowPopup(true);
      }
    } catch (e) {
      setPopupMsg("Network error.");
      setPopupError(true);
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (!selectedSession) {
      setGraph(null);
      setRfNodes([]);
      setRfEdges([]);
      return;
    }
    setLoadingGraph(true);
    fetch(`${API_BASE_URL}/get-session-graph`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: selectedSession }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGraph(data.graph);
        const { nodes, edges } = convertGraphToReactFlow(
          data.graph?.nodes || {},
          handleRunNode,
          setEditNode,
          handleDeleteNode,
          setViewNode,
          handleDuplicateNode // pass duplicate handler
        );
        setRfNodes(nodes);
        setRfEdges(edges);
      })
      .catch(() => {
        setPopupMsg("Failed to fetch graph.");
        setPopupError(true);
        setShowPopup(true);
      })
      .finally(() => setLoadingGraph(false));
  }, [selectedSession, handleDeleteNode]);

  const nodeTypes = { customNode: CustomNode };

  if (!selectedSession) {
    return <div className="placeholder-text">Select a session from the left panel</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div className="main-area-header">
        <h2>Workflow: {selectedSession}</h2>
        <div className="main-area-header-actions">
          <button
            className="add-node-btn"
            onClick={() => setAddNodeModalOpen(true)}
          >
            ＋ Add Node
          </button>
          <button className="compile-session-btn" onClick={handleCompileSession}>
            ⚙️ Compile Workflow
          </button>
          <button
            className="export-session-btn"
            disabled={!selectedSession || !graph}
            title="Export Session as JSON"
            onClick={async () => {
              if (!selectedSession) return;
              try {
                const res = await fetch(`${API_BASE_URL}/get-session-graph`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ session_id: selectedSession }),
                });
                if (!res.ok) throw new Error("Failed to fetch session graph");
                const data = await res.json();
                const jsonStr = JSON.stringify(data.graph, null, 2);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedSession}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                setPopupMsg("Failed to export session as JSON.");
                setPopupError(true);
                setShowPopup(true);
              }
            }}
          >
            <span role="img" aria-label="Export" style={{ fontSize: 18 }}>
              📤
            </span>
            Export JSON
          </button>
          <button
            className="export-session-btn"
            style={{ background: "#232946", color: "#fff" }}
            disabled={!selectedSession}
            title="Download Python Packages"
            onClick={() => setShowPkgModal(true)}
          >
            <span role="img" aria-label="Download" style={{ fontSize: 18 }}>⬇️</span>
            Download Python Packages
          </button>
        </div>
      </div>
      {/* Modal for Python packages */}
      {showPkgModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.18)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              minWidth: 380,
              maxWidth: 480,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 18
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
              Download Python Packages
            </div>
            <div>
              <label>
                <span style={{ fontWeight: 500 }}>Packages (comma separated):</span>
                <input
                  type="text"
                  value={pkgInput}
                  onChange={e => setPkgInput(e.target.value)}
                  placeholder="e.g. python-dotenv,numpy,requests"
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 4,
                    border: "1px solid #e0e0e0",
                    fontSize: 15,
                  }}
                  disabled={pkgLoading}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                className="cancel-node-btn"
                onClick={() => {
                  setShowPkgModal(false);
                  setPkgInput("");
                }}
                disabled={pkgLoading}
              >
                Cancel
              </button>
              <button
                className="update-node-btn"
                disabled={pkgLoading || !pkgInput.trim()}
                onClick={async () => {
                  if (!selectedSession) return;
                  setPkgLoading(true);
                  try {
                    const packages = pkgInput
                      .split(",")
                      .map(p => p.trim())
                      .filter(Boolean);
                    const res = await fetch(`${API_BASE_URL}/downlaod-pypackages`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        session_id: selectedSession,
                        packages,
                      }),
                    });
                    if (res.status === 200) {
                      setShowPkgModal(false);
                      setPkgInput("");
                      setPopupMsg("Python packages download started!");
                      setPopupError(false);
                      setShowPopup(true);
                    } else {
                      const err = await res.text();
                      setPopupMsg("Error: " + err);
                      setPopupError(true);
                      setShowPopup(true);
                    }
                  } catch (e) {
                    setPopupMsg("Network error.");
                    setPopupError(true);
                    setShowPopup(true);
                  } finally {
                    setPkgLoading(false);
                  }
                }}
              >
                {pkgLoading ? "Processing..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
      {loadingGraph ? (
        <div className="loading-text">Loading graph...</div>
      ) : graph && rfNodes.length > 0 ? (
        <div style={{ width: "100%", height: "80vh", minHeight: 400 }}>
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag={true} // <-- Disable global pan on drag
            zoomOnScroll={true}
            nodesDraggable={true} // <-- Ensure nodes are draggable
            nodesConnectable={false}
            elementsSelectable={true}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div className="placeholder-text">No graph data available.</div>
      )}
      {editNode && (
        <NodeEditModal
          node={editNode}
          sessionId={selectedSession}
          onClose={() => setEditNode(null)}
          onUpdated={() => {
            setEditNode(null);
            // Refresh graph after update
            fetch(`${API_BASE_URL}/get-session-graph`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: selectedSession }),
            })
              .then((res) => res.json())
              .then((data) => {
                setGraph(data.graph);
                const { nodes, edges } = convertGraphToReactFlow(
                  data.graph?.nodes || {},
                  handleRunNode,
                  setEditNode,
                  handleDeleteNode
                );
                setRfNodes(nodes);
                setRfEdges(edges);
              });
          }}
          setPopupMsg={setPopupMsg}
          setPopupError={setPopupError}
          setShowPopup={setShowPopup}
        />
      )}
      {viewNode && (
        <ViewNodeModal
          node={viewNode}
          sessionId={selectedSession!}
          onClose={() => setViewNode(null)}
        />
      )}
      {addNodeModalOpen && (
        <NodeEditModal
          node={{}} // empty node for add
          sessionId={selectedSession}
          onClose={() => setAddNodeModalOpen(false)}
          onUpdated={() => setAddNodeModalOpen(false)}
          setPopupMsg={setPopupMsg}
          setPopupError={setPopupError}
          setShowPopup={setShowPopup}
          isAddMode={true}
          onAddNode={handleAddNode}
        />
      )}
    </div>
  );
};

export default GraphArea;
