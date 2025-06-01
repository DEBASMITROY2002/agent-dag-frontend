import { API_BASE_URL } from "../App";

export const fetchSessionsUtil = async (
    setSessions: (sessions: string[]) => void,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
) => {
    try {
        const res = await fetch(`${API_BASE_URL}/list-sessions`);
        const data = await res.json();
        setSessions(data.sessions || []);
    } catch (e) {
        setPopupMsg("Failed to fetch sessions.");
        setPopupError(true);
        setShowPopup(true);
    }
};

export const handleCreateSessionUtil = async (
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void,
    fetchSessions: () => void
) => {
    const session_id = prompt("Enter new workflow name:");
    if (!session_id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/create-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id }),
        });
        if (res.status === 200 || res.status === 201) {
            setPopupMsg("Workflow created successfully!");
            setPopupError(false);
            setShowPopup(true);
            fetchSessions();
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

export const handleDeleteSessionUtil = async (
    session_id: string,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void,
    selectedSession: string | null,
    setSelectedSession: (s: string | null) => void,
    fetchSessions: () => void
) => {
    if (!window.confirm(`Delete workflow "${session_id}"?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/delete-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id }),
        });
        if (res.status === 200) {
            setPopupMsg("Workflow deleted successfully!");
            setPopupError(false);
            setShowPopup(true);
            if (selectedSession === session_id) setSelectedSession(null);
            fetchSessions();
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

export const handleCompileSessionUtil = async (
    selectedSession: string | null,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
    // fetchGraph?: (sessionId: string) => void
) => {
    if (!selectedSession) return;
    try {
        const res = await fetch(`${API_BASE_URL}/compile-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: selectedSession }),
        });
        if (res.status === 200) {
            setPopupMsg("Workflow compiled successfully!");
            setPopupError(false);
            setShowPopup(true);
            // Optionally refetch graph
            // if (fetchGraph) fetchGraph(selectedSession);
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

export const handleRunNodeUtil = async (
    selectedSession: string | null,
    nodeId: string,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
    // fetchGraph?: (sessionId: string) => void
) => {
    if (!selectedSession) return;
    try {
        const res = await fetch(`${API_BASE_URL}/execute-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: selectedSession,
                start_node: nodeId,
            }),
        });
        if (res.status === 200) {
            setPopupMsg(`Node "${nodeId}" executed successfully!`);
            setPopupError(false);
            setShowPopup(true);
            // Optionally refetch graph to update node status
            // if (fetchGraph) fetchGraph(selectedSession);
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

export const handleDuplicateSessionUtil = async (
    sessionToDuplicate: string | null,
    duplicateSessionName: string,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void,
    fetchSessions: () => void
) => {
    if (!duplicateSessionName.trim() || !sessionToDuplicate) {
        setPopupMsg("Please enter a valid workflow name.");
        setPopupError(true);
        setShowPopup(true);
        return;
    }
    setPopupMsg("Duplicating workflow...");
    setPopupError(false);
    setShowPopup(true);

    try {
        // 1. Create new session
        const createRes = await fetch(`${API_BASE_URL}/create-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: duplicateSessionName }),
        });
        if (!createRes.ok) throw new Error("Failed to create new workflow");
        // 2. Get nodes from original session
        const graphRes = await fetch(`${API_BASE_URL}/get-session-graph`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionToDuplicate }),
        });
        const graphData = await graphRes.json();
        const nodes = graphData.graph?.nodes || {};
        // 3. Add each node to new session (body structure matches GraphArea)
        for (const nodeId in nodes) {
            const node = nodes[nodeId];

            let nodeData = {};

            // If nodeName is "inputs"
            if (node.nodeName === "inputs") {
                nodeData = {
                    input_fields: {
                        ...node._outputs
                    }
                }

                await fetch(`${API_BASE_URL}/add-input`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        session_id: duplicateSessionName,
                        ...nodeData
                    }),
                });
            } else {
                nodeData = {
                    node_name: node.nodeName,
                    system_instructions: node.systemInstructions,
                    user_prompt: node.userPrompt,
                    python_code: node.pythonCode,
                    output_schema: node.outputSchema,
                    use_LLM: node.use_LLM !== undefined ? node.use_LLM : node.useLLM,
                    json_mode: node.json_mode !== undefined ? node.json_mode : node.jsonMode,
                    tool_name: node.tool_name !== undefined ? node.tool_name : node.toolName,
                    tool_description: node.tool_description !== undefined ? node.tool_description : node.toolDescription,
                    kwargs: node.kwargs
                }

                await fetch(`${API_BASE_URL}/add-node`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        session_id: duplicateSessionName,
                        ...nodeData
                    }),
                });
            }
        }
        setPopupMsg("Workflow duplicated successfully.");
        setPopupError(false);
        fetchSessions();
    } catch (err) {
        setPopupMsg("Failed to duplicate workflow.");
        setPopupError(true);
    } finally {
        setShowPopup(true);
    }
};
