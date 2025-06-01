import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ViewNodeModalProps {
    node: any;
    sessionId: string;
    onClose: () => void;
}

const renderMarkdownWithLineBreaks = (text: string) =>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{text.replace(/\\n/g, "\n")}</ReactMarkdown>;

const ViewNodeModal: React.FC<ViewNodeModalProps> = ({ node, sessionId, onClose }) => {
    // State for expanded output
    const [expandedOutput, setExpandedOutput] = useState<{ key: string, value: any } | null>(null);

    return (
        <div
            className="modal-overlay"
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.25)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <div
                className="modal-content"
                style={{
                    minWidth: 400,
                    maxWidth: 600,
                    maxHeight: "80vh",
                    overflowY: "auto",
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
                    padding: 24
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Node: {node.nodeName}</h3>
                    <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer" }}>✖</button>
                </div>
                <div style={{ marginTop: 12 }}>
                    <div><b>ID:</b> {node.id}</div>
                    {node.userPrompt && (
                        <div>
                            <b>User Prompt:</b>
                            <div style={{ maxHeight: 80, overflowY: "auto", background: "#f6f6f6", borderRadius: 4, padding: "2px 4px", marginBottom: 4 }}>
                                {renderMarkdownWithLineBreaks(String(node.userPrompt))}
                            </div>
                        </div>
                    )}
                    {node.systemInstructions && (
                        <div>
                            <b>System:</b>
                            <div style={{ maxHeight: 80, overflowY: "auto", background: "#f6f6f6", borderRadius: 4, padding: "2px 4px", marginBottom: 4 }}>
                                {renderMarkdownWithLineBreaks(String(node.systemInstructions))}
                            </div>
                        </div>
                    )}
                    {node.kwargs && Object.keys(node.kwargs).length > 0 && (
                        <div>
                            <b>Kwargs:</b>
                            <pre style={{ maxHeight: 80, overflowY: "auto", background: "#f6f6f6", borderRadius: 4, padding: "2px 4px", marginBottom: 4 }}>
                                {JSON.stringify(node.kwargs, null, 2)}
                            </pre>
                        </div>
                    )}
                    {node.outputSchema && (
                        <div>
                            <b>Output Schema:</b>
                            <pre style={{ maxHeight: 80, overflowY: "auto", background: "#f6f6f6", borderRadius: 4, padding: "2px 4px", marginBottom: 4 }}>
                                {JSON.stringify(node.outputSchema, null, 2)}
                            </pre>
                        </div>
                    )}
                    {node._outputs && (
                        <div>
                            <b>Outputs:</b>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {Object.entries(node._outputs).map(([key, value]) => (
                                    <div key={key}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div><b>{key}:</b></div>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button
                                                    title="Copy value to clipboard"
                                                    style={{
                                                        background: "#e0e0e0",
                                                        border: "none",
                                                        borderRadius: 4,
                                                        cursor: "pointer",
                                                        padding: "4px 8px",
                                                        fontSize: 14,
                                                    }}
                                                    onClick={() => {
                                                        // If value is string, copy it directly. Else stringify.
                                                        const formatted =
                                                            typeof value === "string" ? value.replace(/\\n/g, "\n") : JSON.stringify(value, null, 2);
                                                        navigator.clipboard.writeText(formatted);
                                                    }}
                                                >
                                                    📋 Copy
                                                </button>
                                                <button
                                                    title="Expand output"
                                                    style={{
                                                        background: "#eebbc3",
                                                        border: "none",
                                                        borderRadius: 4,
                                                        cursor: "pointer",
                                                        padding: "4px 8px",
                                                        fontSize: 14,
                                                        color: "#232946"
                                                    }}
                                                    onClick={() => setExpandedOutput({ key, value })}
                                                >
                                                    ⬈ Expand
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                maxHeight: 200,
                                                overflowY: "auto",
                                                overflowX: "auto",
                                                background: "#f6f6f6",
                                                borderRadius: 4,
                                                padding: "6px 8px",
                                                marginTop: 4,
                                                whiteSpace: "pre",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {typeof value === "string" ? (
                                                renderMarkdownWithLineBreaks(value)
                                            ) : (
                                                <pre style={{ margin: 0 }}>{JSON.stringify(value, null, 2)}</pre>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Expanded Output Modal */}
            {expandedOutput && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.32)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <div
                        style={{
                            minWidth: 480,
                            maxWidth: "80vw",
                            maxHeight: "80vh",
                            background: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
                            padding: 32,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 18 }}>
                                Output: {expandedOutput.key}
                            </div>
                            <button
                                onClick={() => setExpandedOutput(null)}
                                style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer" }}
                            >✖</button>
                        </div>
                        <div
                            style={{
                                background: "#f6f6f6",
                                borderRadius: 4,
                                padding: "12px 16px",
                                fontFamily: "monospace",
                                fontSize: 16,
                                maxHeight: "60vh",
                                overflowY: "auto"
                            }}
                        >
                            {typeof expandedOutput.value === "string" ? (
                                renderMarkdownWithLineBreaks(expandedOutput.value)
                            ) : (
                                <pre style={{ margin: 0 }}>{JSON.stringify(expandedOutput.value, null, 2)}</pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewNodeModal;
