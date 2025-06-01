import { API_BASE_URL } from "../App";

export const fetchSessionsUtil = (
    setSessions: (sessions: string[]) => void,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
) => {
    fetch(`${API_BASE_URL}/list-sessions`, { method: "POST" })
        .then(res => {
            console.log("Response :", res);
            return res
        })
        .then(res => res.json())
        .then(data => {
            setSessions(data.sessions || []);
        })
        .catch(() => {
            setPopupMsg("Failed to fetch sessions.");
            setPopupError(true);
            setShowPopup(true);
        });
};

export const handleCreateSessionUtil = (
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void,
    fetchSessions: () => void
) => {
    const session_id = prompt("Enter new workflow name:");
    if (!session_id) return;
    fetch(`${API_BASE_URL}/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
    })
        .then(res => {
            if (res.status === 200 || res.status === 201) {
                setPopupMsg("Workflow created successfully!");
                setPopupError(false);
                setShowPopup(true);
                fetchSessions();
            } else {
                return res.text().then(err => {
                    setPopupMsg("Error: " + err);
                    setPopupError(true);
                    setShowPopup(true);
                });
            }
        })
        .catch(() => {
            setPopupMsg("Network error.");
            setPopupError(true);
            setShowPopup(true);
        });
};

export const handleDeleteSessionUtil = (
    session_id: string,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void,
    selectedSession: string | null,
    setSelectedSession: (s: string | null) => void,
    fetchSessions: () => void
) => {
    if (!window.confirm(`Delete workflow "${session_id}"?`)) return;
    fetch(`${API_BASE_URL}/delete-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
    })
        .then(res => {
            if (res.status === 200) {
                setPopupMsg("Workflow deleted successfully!");
                setPopupError(false);
                setShowPopup(true);
                if (selectedSession === session_id) setSelectedSession(null);
                fetchSessions();
            } else {
                return res.text().then(err => {
                    setPopupMsg("Error: " + err);
                    setPopupError(true);
                    setShowPopup(true);
                });
            }
        })
        .catch(() => {
            setPopupMsg("Network error.");
            setPopupError(true);
            setShowPopup(true);
        });
};

export const handleCompileSessionUtil = (
    selectedSession: string | null,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
    // fetchGraph?: (sessionId: string) => void
) => {
    if (!selectedSession) return;
    fetch(`${API_BASE_URL}/compile-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession }),
    })
        .then(res => {
            if (res.status === 200) {
                setPopupMsg("Workflow compiled successfully!");
                setPopupError(false);
                setShowPopup(true);
                // Optionally refetch graph
                // if (fetchGraph) fetchGraph(selectedSession);
            } else {
                return res.text().then(err => {
                    setPopupMsg("Error: " + err);
                    setPopupError(true);
                    setShowPopup(true);
                });
            }
        })
        .catch(() => {
            setPopupMsg("Network error.");
            setPopupError(true);
            setShowPopup(true);
        });
};

export const handleRunNodeUtil = (
    selectedSession: string | null,
    nodeId: string,
    setPopupMsg: (msg: string) => void,
    setPopupError: (err: boolean) => void,
    setShowPopup: (show: boolean) => void
    // fetchGraph?: (sessionId: string) => void
) => {
    if (!selectedSession) return;
    fetch(`${API_BASE_URL}/execute-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: selectedSession,
            start_node: nodeId,
        }),
    })
        .then(res => {
            if (res.status === 200) {
                setPopupMsg(`Node "${nodeId}" executed successfully!`);
                setPopupError(false);
                setShowPopup(true);
                // Optionally refetch graph to update node status
                // if (fetchGraph) fetchGraph(selectedSession);
            } else {
                return res.text().then(err => {
                    setPopupMsg("Error: " + err);
                    setPopupError(true);
                    setShowPopup(true);
                });
            }
        })
        .catch(() => {
            setPopupMsg("Network error.");
            setPopupError(true);
            setShowPopup(true);
        });
};

export const handleDuplicateSessionUtil = (
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

    // Use promise chain instead of async/await
    fetch(`${API_BASE_URL}/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: duplicateSessionName }),
    })
        .then(createRes => {
            if (!createRes.ok) throw new Error("Failed to create new workflow");
            return fetch(`${API_BASE_URL}/get-session-graph`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionToDuplicate }),
            });
        })
        .then(graphRes => graphRes.json())
        .then(graphData => {
            const nodes = graphData.graph?.nodes || {};
            // Sequentially add nodes using promise chaining
            let promise: Promise<void> = Promise.resolve();
            for (const nodeId in nodes) {
                const node = nodes[nodeId];
                let nodeData = {};
                if (node.nodeName === "inputs") {
                    nodeData = {
                        input_fields: {
                            ...node._outputs
                        }
                    };
                    promise = promise.then(() =>
                        fetch(`${API_BASE_URL}/add-input`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                session_id: duplicateSessionName,
                                ...nodeData
                            }),
                        }).then(() => {}) // <-- ensure Promise<void>
                    );
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
                    };
                    promise = promise.then(() =>
                        fetch(`${API_BASE_URL}/add-node`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                session_id: duplicateSessionName,
                                ...nodeData
                            }),
                        }).then(() => {}) // <-- ensure Promise<void>
                    );
                }
            }
            return promise;
        })
        .then(() => {
            setPopupMsg("Workflow duplicated successfully.");
            setPopupError(false);
            fetchSessions();
        })
        .catch(() => {
            setPopupMsg("Failed to duplicate workflow.");
            setPopupError(true);
        })
        .finally(() => {
            setShowPopup(true);
        });
};
