import React, { useEffect, useState } from "react";
import "./App.css";
import SessionList from "./components/SessionList";
import Popup from "./components/Popup";
import GraphArea from "./components/GraphArea";
import { CustomNode, convertGraphToReactFlow } from "./utils/GraphUtils";
import {
  fetchSessionsUtil,
  handleCreateSessionUtil,
  handleDeleteSessionUtil,
  handleCompileSessionUtil,
  handleRunNodeUtil,
  handleDuplicateSessionUtil, // Add import
} from "../src/utils/SessionHandlerUtils";

// Define API_BASE_URL at the top of the file
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://6239-202-168-85-114.ngrok-free.app/";

const App = () => {
  
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [popupError, setPopupError] = useState(false);
  const [graph, setGraph] = useState<any>(null);
  const [rfNodes, setRfNodes] = useState<any[]>([]);
  const [rfEdges, setRfEdges] = useState<any[]>([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [duplicateSessionName, setDuplicateSessionName] = useState("");
  const [sessionToDuplicate, setSessionToDuplicate] = useState<string | null>(null);

  const fetchSessions = () =>
    fetchSessionsUtil(setSessions, setPopupMsg, setPopupError, setShowPopup);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  
  // Fetch graph when session changes
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
          handleRunNode
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
  }, [selectedSession]);

  
  // Session handlers now use the utility functions
  const handleCreateSession = () =>
    handleCreateSessionUtil(setPopupMsg, setPopupError, setShowPopup, fetchSessions);
  const handleDeleteSession = (session_id: string) =>
    handleDeleteSessionUtil(session_id, setPopupMsg, setPopupError, setShowPopup, selectedSession, setSelectedSession, fetchSessions);
  const handleCompileSession = () =>
    handleCompileSessionUtil(selectedSession, setPopupMsg, setPopupError, setShowPopup /*, fetchGraph */);
  const handleRunNode = (nodeId: string) =>
    handleRunNodeUtil(selectedSession, nodeId, setPopupMsg, setPopupError, setShowPopup /*, fetchGraph */);

  const handleDuplicateSessionClick = (session_id: string) => {
    setSessionToDuplicate(session_id);
    setDuplicateSessionName("");
    setShowDuplicatePopup(true);
  };

  const handleDuplicateSessionConfirm = async () => {
    setShowDuplicatePopup(false);
    await handleDuplicateSessionUtil(
      sessionToDuplicate,
      duplicateSessionName,
      setPopupMsg,
      setPopupError,
      setShowPopup,
      fetchSessions
    );
  };

  // Register custom node type
  const nodeTypes = { customNode: CustomNode };

  return (
    <div className="app-container">
      <div className="side-panel">
        <div className="side-panel-header">
          <button
            className="create-session-btn"
            onClick={handleCreateSession}
            title="Create Workflow"
          >
            <span className="plus-icon">＋</span>
          </button>
          <span className="side-panel-title">Workflows</span>
        </div>
        <SessionList
          sessions={sessions}
          selectedSession={selectedSession}
          onSelect={setSelectedSession}
          onDelete={handleDeleteSession}
          onDuplicate={handleDuplicateSessionClick}
        />
      </div>
      <div className="main-area">
        <GraphArea
          selectedSession={selectedSession}
          handleCompileSession={handleCompileSession}
          handleRunNode={handleRunNode}
          showPopup={showPopup}
          setShowPopup={setShowPopup}
          setPopupMsg={setPopupMsg}
          setPopupError={setPopupError}
        />
      </div>
      {showPopup && (
        <Popup
          message={popupMsg.replace(/session/gi, "workflow")}
          error={popupError}
          onClose={() => setShowPopup(false)}
        />
      )}
      {showDuplicatePopup && (
        <div className="popup-overlay duplicate-session-popup-overlay">
          <div className="popup duplicate-session-popup">
            <div className="duplicate-session-title">Duplicate Workflow</div>
            <div className="duplicate-session-label">Enter new workflow name:</div>
            <input
              className="duplicate-session-input"
              type="text"
              value={duplicateSessionName}
              onChange={e => setDuplicateSessionName(e.target.value)}
              autoFocus
            />
            <div className="duplicate-session-actions">
              <button className="duplicate-session-btn-confirm" onClick={handleDuplicateSessionConfirm}>Duplicate</button>
              <button className="duplicate-session-btn-cancel" onClick={() => setShowDuplicatePopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
