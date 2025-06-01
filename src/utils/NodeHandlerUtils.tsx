import { convertGraphToReactFlow } from "./GraphUtils";
import { API_BASE_URL } from "../App";

export async function handleDeleteNodeUtil({
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
}: {
  nodeName: string;
  selectedSession: string | null;
  setPopupMsg: (msg: string) => void;
  setPopupError: (v: boolean) => void;
  setShowPopup: (v: boolean) => void;
  setGraph: (g: any) => void;
  setRfNodes: (n: any[]) => void;
  setRfEdges: (e: any[]) => void;
  handleRunNode: (nodeId: string) => void;
  setEditNode: (node: any) => void;
}) {
  if (!selectedSession) return;
  if (!window.confirm(`Delete node "${nodeName}"?`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/remove-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: selectedSession,
        node_name: nodeName,
      }),
    });
    if (res.status === 200) {
      setPopupMsg("Node deleted successfully!");
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
          // --- fix: create a wrapper for handleDeleteNode ---
          const handleDeleteNodeWrapper = (nodeName: string) =>
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
            });
          const { nodes, edges } = convertGraphToReactFlow(
            data.graph?.nodes || {},
            handleRunNode,
            setEditNode,
            handleDeleteNodeWrapper
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
}

export async function handleAddNodeUtil({
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
}: {
  nodeData: any;
  selectedSession: string | null;
  setPopupMsg: (msg: string) => void;
  setPopupError: (v: boolean) => void;
  setShowPopup: (v: boolean) => void;
  setAddNodeModalOpen: (v: boolean) => void;
  setGraph: (g: any) => void;
  setRfNodes: (n: any[]) => void;
  setRfEdges: (e: any[]) => void;
  handleRunNode: (nodeId: string) => void;
  setEditNode: (node: any) => void;
}) {
  if (!selectedSession) return;
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
      setPopupMsg("Node added successfully!");
      setPopupError(false);
      setShowPopup(true);
      setAddNodeModalOpen(false);
      // Refresh graph after add
      fetch(`${API_BASE_URL}/get-session-graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession }),
      })
        .then((res) => res.json())
        .then((data) => {
          setGraph(data.graph);
          // --- fix: create a wrapper for handleDeleteNode ---
          const handleDeleteNodeWrapper = (nodeName: string) =>
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
            });
          const { nodes, edges } = convertGraphToReactFlow(
            data.graph?.nodes || {},
            handleRunNode,
            setEditNode,
            handleDeleteNodeWrapper
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
}
