import React, { useState, useRef, useEffect } from "react";
import "./NodeEditModal.css";
import { API_BASE_URL } from "../App";

interface NodeEditModalProps {
  node: any;
  sessionId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  setPopupMsg: (msg: string) => void;
  setPopupError: (v: boolean) => void;
  setShowPopup: (v: boolean) => void;
  isAddMode?: boolean;
  onAddNode?: (nodeData: any) => void;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  node,
  sessionId,
  onClose,
  onUpdated,
  setPopupMsg,
  setPopupError,
  setShowPopup,
  isAddMode = false,
  onAddNode,
}) => {
  const [systemInstructions, setSystemInstructions] = useState(node.systemInstructions || "");
  const [userPrompt, setUserPrompt] = useState(node.userPrompt || "");
  const [functionBody, setFunctionBody] = useState(node.pythonCode?.function_body || "");
  const [argument, setArgument] = useState(JSON.stringify(node.pythonCode?.argument || {}, null, 2));
  const [outputSchema, setOutputSchema] = useState(JSON.stringify(node.outputSchema || {}, null, 2));
  const [useLLM, setUseLLM] = useState(
    node.use_LLM !== undefined ? node.use_LLM : (node.useLLM !== undefined ? node.useLLM : false)
  );
  const [jsonMode, setJsonMode] = useState(
    node.json_mode !== undefined ? node.json_mode : (node.jsonMode !== undefined ? node.jsonMode : false)
  );
  const [toolName, setToolName] = useState(
    node.tool_name !== undefined ? node.tool_name : (node.toolName !== undefined ? node.toolName : "")
  );
  const [toolDescription, setToolDescription] = useState(
    node.tool_description !== undefined ? node.tool_description : (node.toolDescription !== undefined ? node.toolDescription : "")
  );

  // For "inputs" node, manage outputSchema as a key-value object
  const [inputsObj, setInputsObj] = useState<{ [key: string]: string }>(
    node.outputSchema ? { ...node.outputSchema } : {}
  );

  // For arguments and output schema as key-value pairs
  const [argsArr, setArgsArr] = useState<[string, string][]>(
    node.pythonCode?.argument
      ? Object.entries(node.pythonCode.argument)
      : [["", ""]]
  );
  const [outputArr, setOutputArr] = useState<[string, string][]>(
    node.outputSchema
      ? Object.entries(node.outputSchema)
      : [["", ""]]
  );

  // For kwargs as key-value pairs (fixed keys)
  const defaultKwargs = {
    deployed_gcp: false,
    max_output_tokens: 1000,
    max_retries: 5,
    model_name: "gpt-3.5-turbo",
    temperature: 0.5,
    wait_time: 30,
  };
  const initialKwargs = { ...defaultKwargs, ...(node.kwargs || {}) };
  const [kwargs, setKwargs] = useState<{ [key: string]: any }>(initialKwargs);

  // For Add Node: node_name input state
  const [newNodeName, setNewNodeName] = useState(node.nodeName || node.node_name || "");

  // Helper for model_name options
  const modelNameOptions = [
    "gpt-3.5-turbo",
    "gemini-1.5-pro",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash-002",
    "<Custom>"
  ];

  // Auto-resize textarea helper
  function useAutoResize(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
    useEffect(() => {
      if (ref.current) {
        try {
          window.requestAnimationFrame(() => {
            if (ref.current) {
              ref.current.style.height = "auto";
              ref.current.style.height = ref.current.scrollHeight + "px";
            }
          });
        } catch (e) {
          // Suppress ResizeObserver loop errors
        }
      }
    }, [value]);
  }

  // Refs for textareas
  const sysInstrRef = useRef<HTMLTextAreaElement>(null!);
  const userPromptRef = useRef<HTMLTextAreaElement>(null!);
  const functionBodyRef = useRef<HTMLTextAreaElement>(null!);
  const argumentRef = useRef<HTMLTextAreaElement>(null!);
  const outputSchemaRef = useRef<HTMLTextAreaElement>(null!);
  const toolDescRef = useRef<HTMLTextAreaElement>(null!);

  useAutoResize(sysInstrRef, systemInstructions);
  useAutoResize(userPromptRef, userPrompt);
  useAutoResize(functionBodyRef, functionBody);
  useAutoResize(argumentRef, argument);
  useAutoResize(outputSchemaRef, outputSchema);
  useAutoResize(toolDescRef, toolDescription);

  // Handlers for dynamic fields
  const handleArgChange = (idx: number, key: string, value: string) => {
    setArgsArr(arr => {
      const newArr = [...arr];
      newArr[idx] = [key, value];
      return newArr;
    });
  };
  const addArgField = () => setArgsArr(arr => [...arr, ["", ""]]);
  const removeArgField = (idx: number) => setArgsArr(arr => arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr);

  const handleOutputChange = (idx: number, key: string, value: string) => {
    setOutputArr(arr => {
      const newArr = [...arr];
      newArr[idx] = [key, value];
      return newArr;
    });
  };
  const addOutputField = () => setOutputArr(arr => [...arr, ["", ""]]);
  const removeOutputField = (idx: number) => setOutputArr(arr => arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr);

  const handleInputChange = (idx: number, key: string, value: string) => {
    setInputsObj(prev => {
      const keys = Object.keys(prev);
      const oldKey = keys[idx];
      const newObj = { ...prev };
      if (oldKey !== key) {
        delete newObj[oldKey];
      }
      newObj[key] = value;
      return newObj;
    });
  };
  const addInputField = () => setInputsObj(prev => ({ ...prev, "": "" }));
  const removeInputField = (idx: number) => {
    const keys = Object.keys(inputsObj);
    if (keys.length <= 1) return;
    const keyToRemove = keys[idx];
    setInputsObj(prev => {
      const newObj = { ...prev };
      delete newObj[keyToRemove];
      return newObj;
    });
  };

  // Handler for kwargs
  const handleKwargChange = (key: string, value: any) => {
    setKwargs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Update handler
  const handleUpdate = async () => {
    if (!sessionId) return;

    // Special handling for "inputs" node
    if (node.nodeName === "inputs") {
      try {
        const res = await fetch(`${API_BASE_URL}/add-input`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            input_fields: inputsObj,
          }),
        });
        if (res.status === 200) {
          setPopupMsg("Inputs updated successfully!");
          setPopupError(false);
          setShowPopup(true);
          onUpdated();
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
      return;
    }

    // Convert argsArr/outputArr to objects
    const parsedArgument: Record<string, string> = {};
    argsArr.forEach(([k, v]) => {
      if (k.trim()) parsedArgument[k.trim()] = v;
    });
    const parsedOutputSchema: Record<string, string> = {};
    outputArr.forEach(([k, v]) => {
      if (k.trim()) parsedOutputSchema[k.trim()] = v;
    });

    try {
      console.log("kwargs", kwargs);

      const res = await fetch(`${API_BASE_URL}/update-node`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          node_name: node.nodeName,
          system_instructions: systemInstructions,
          user_prompt: userPrompt,
          python_code: {
            argument: parsedArgument,
            function_body: functionBody,
          },
          output_schema: parsedOutputSchema,
          use_LLM: useLLM,
          json_mode: jsonMode,
          tool_name: toolName,
          tool_description: toolDescription,
          kwargs,
        }),
      });



      if (res.status === 200) {
        setPopupMsg("Node updated successfully!");
        setPopupError(false);
        setShowPopup(true);
        onUpdated();
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

  // Handler for Add Node
  const handleAdd = async () => {
    // Convert argsArr/outputArr to objects
    const parsedArgument: Record<string, string> = {};
    argsArr.forEach(([k, v]) => {
      if (k.trim()) parsedArgument[k.trim()] = v;
    });
    const parsedOutputSchema: Record<string, string> = {};
    outputArr.forEach(([k, v]) => {
      if (k.trim()) parsedOutputSchema[k.trim()] = v;
    });

    const nodeData = {
      node_name: newNodeName, // use the input value for node_name
      system_instructions: systemInstructions,
      user_prompt: userPrompt,
      python_code: {
        argument: parsedArgument,
        function_body: functionBody,
      },
      output_schema: parsedOutputSchema,
      use_LLM: useLLM,
      json_mode: jsonMode,
      tool_name: toolName,
      tool_description: toolDescription,
      kwargs,
    };

    if (onAddNode) {
      await onAddNode(nodeData);
      // onAddNode should close the modal and refresh
    }
  };

  const PYTHON_CODE_PLACEHOLDER = `import time;
#The method name should be "function"
#The argument names should match the "Python Code Arguments"
#The returned dictionary keys should match the "Output Schema"
def function(arg1):
    time.sleep(10);
    return {"caps":arg1.upper()}
`;

  return (
    <div className="node-edit-modal-backdrop">
      <div className="node-edit-modal">
        <h2 style={{ marginBottom: 18 }}>
          {isAddMode ? "Add Node" : `Edit Node: ${node.nodeName}`}
        </h2>
        {isAddMode && (
          <div className="node-section" style={{ marginBottom: 18 }}>
            <label>
              <b>Node Name:</b>
              <input
                type="text"
                value={newNodeName}
                onChange={e => setNewNodeName(e.target.value)}
                className="form-control"
                style={{ marginLeft: 8, width: "60%" }}
                placeholder="Enter node name"
                required
              />
            </label>
          </div>
        )}
        {node.nodeName === "inputs" ? (
          <>
            <div className="node-section">
              <h3 style={{ marginTop: 0 }}>Input Fields</h3>
              {Object.keys(inputsObj).length === 0 && (
                <div style={{ color: "#888", marginBottom: 12 }}>No inputs defined.</div>
              )}
              {Object.entries(inputsObj).map(([key, value], idx) => (
                <React.Fragment key={idx}>
                  <div
                    className="form-group"
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      marginBottom: 16,
                      flexDirection: "column"
                    }}
                  >
                    <input
                      value={key}
                      placeholder="Input Key"
                      onChange={e => handleInputChange(idx, e.target.value, value)}
                      style={{ fontFamily: "monospace", width: "100%", marginBottom: 6 }}
                    />
                    <textarea
                      value={value}
                      placeholder="Input Value"
                      onChange={e => handleInputChange(idx, key, e.target.value)}
                      style={{
                        fontFamily: "monospace",
                        width: "100%",
                        minHeight: 160,
                        maxHeight: 400,
                        resize: "vertical",
                        overflowY: "auto",
                        background: "#f6f6f6",
                        borderRadius: 4,
                        padding: "8px",
                        fontSize: 15,
                        boxSizing: "border-box"
                      }}
                    />
                    {/* Show Delete button only if more than 1 input field */}
                    {Object.keys(inputsObj).length > 1 && (
                      <button
                        type="button"
                        className="cancel-node-btn"
                        onClick={() => removeInputField(idx)}
                        style={{ alignSelf: "flex-end", marginTop: 4 }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {/* Separator between input fields, except after the last one */}
                  {idx < Object.entries(inputsObj).length - 1 && (
                    <hr style={{ width: "100%", border: "0", borderTop: "1px solid #eee", margin: "8px 0" }} />
                  )}
                </React.Fragment>
              ))}
              <button type="button" className="update-node-btn" onClick={addInputField}>Add Field</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="node-section">
              <h3 style={{ marginTop: 0 }}>Instructions</h3>
              <div className="form-group">
                <label>System Instructions:</label>
                <textarea
                  ref={sysInstrRef}
                  value={systemInstructions}
                  onChange={e => setSystemInstructions(e.target.value)}
                  className="form-control"
                  style={{ minHeight: 80 }}
                />
              </div>
              <div className="form-group">
                <label>User Prompt:</label>
                <textarea
                  ref={userPromptRef}
                  value={userPrompt}
                  onChange={e => setUserPrompt(e.target.value)}
                  className="form-control"
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
            <div className="node-section">
              <h3>Python Code Arguments</h3>
              {argsArr.map(([k, v], idx) => (
                <div className="form-group" key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <input
                    value={k}
                    placeholder="Argument Key"
                    onChange={e => handleArgChange(idx, e.target.value, v)}
                    style={{ fontFamily: "monospace", width: "40%" }}
                  />
                  <input
                    value={v}
                    placeholder="Argument Value"
                    onChange={e => handleArgChange(idx, k, e.target.value)}
                    style={{ fontFamily: "monospace", width: "50%" }}
                  />
                  <button type="button" className="cancel-node-btn" onClick={() => removeArgField(idx)}>-</button>
                </div>
              ))}
              <button type="button" className="update-node-btn" onClick={addArgField}>Add Argument</button>
            </div>
            <div className="node-section">
              <h3>Python Function Body</h3>
              <div className="form-group">
                <textarea
                  ref={functionBodyRef}
                  value={functionBody}
                  onChange={e => setFunctionBody(e.target.value)}
                  className="form-control python-code-area"
                  style={{ minHeight: 120, fontFamily: "monospace" }}
                  spellCheck={false}
                  placeholder={isAddMode ? PYTHON_CODE_PLACEHOLDER : undefined}
                />
              </div>
            </div>
            <div className="node-section">
              <h3>Output Schema</h3>
              {outputArr.map(([k, v], idx) => (
                <div className="form-group" key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <input
                    value={k}
                    placeholder="Output Key"
                    onChange={e => handleOutputChange(idx, e.target.value, v)}
                    style={{ fontFamily: "monospace", width: "40%" }}
                  />
                  <input
                    value={v}
                    placeholder="Output Description"
                    onChange={e => handleOutputChange(idx, k, e.target.value)}
                    style={{ fontFamily: "monospace", width: "50%" }}
                  />
                  <button type="button" className="cancel-node-btn" onClick={() => removeOutputField(idx)}>-</button>
                </div>
              ))}
              <button type="button" className="update-node-btn" onClick={addOutputField}>Add Output</button>
            </div>
            <div className="node-section">
              <h3>LLM Properties</h3>
              <div className="form-group">
                <label>Use LLM:</label>
                <select
                  value={useLLM ? "true" : "false"}
                  onChange={e => setUseLLM(e.target.value === "true")}
                  className="form-control"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
              <div className="form-group">
                <label>JSON Mode:</label>
                <select
                  value={jsonMode ? "true" : "false"}
                  onChange={e => setJsonMode(e.target.value === "true")}
                  className="form-control"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tool Name:</label>
                <input
                  value={toolName}
                  onChange={e => setToolName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Tool Description:</label>
                <textarea
                  ref={toolDescRef}
                  value={toolDescription}
                  onChange={e => setToolDescription(e.target.value)}
                  className="form-control"
                  style={{ minHeight: 60 }}
                />
              </div>
            </div>
            <div className="node-section">
              <h3>Additional Params (kwargs)</h3>
              {/* deployed_gcp */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>deployed_gcp</label>
                <select
                  value={kwargs.deployed_gcp ? "true" : "false"}
                  onChange={e => handleKwargChange("deployed_gcp", e.target.value === "true")}
                  style={{ width: "50%" }}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
              {/* max_output_tokens */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>max_output_tokens</label>
                <input
                  type="range"
                  min={1}
                  max={10000}
                  step={1}
                  value={kwargs.max_output_tokens}
                  onChange={e => handleKwargChange("max_output_tokens", Number(e.target.value))}
                  style={{ width: "40%" }}
                />
                <span style={{ width: 60 }}>{kwargs.max_output_tokens}</span>
              </div>
              {/* max_retries */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>max_retries</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={kwargs.max_retries}
                  onChange={e => handleKwargChange("max_retries", Number(e.target.value))}
                  style={{ width: "40%" }}
                />
                <span style={{ width: 40 }}>{kwargs.max_retries}</span>
              </div>
              {/* model_name */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>model_name</label>
                <select
                  value={modelNameOptions.includes(kwargs.model_name) ? kwargs.model_name : "<Custom>"}
                  onChange={e => {
                    if (e.target.value === "<Custom>") {
                      handleKwargChange("model_name", "");
                    } else {
                      handleKwargChange("model_name", e.target.value);
                    }
                  }}
                  style={{ width: "40%" }}
                >
                  {modelNameOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {(!modelNameOptions.includes(kwargs.model_name)) && (
                  <input
                    type="text"
                    value={kwargs.model_name}
                    placeholder="Custom model name"
                    onChange={e => handleKwargChange("model_name", e.target.value)}
                    style={{ width: "40%" }}
                  />
                )}
              </div>
              {/* temperature */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>temperature</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={kwargs.temperature}
                  onChange={e => handleKwargChange("temperature", parseFloat(e.target.value))}
                  style={{ width: "40%" }}
                />
                <span style={{ width: 40 }}>{kwargs.temperature}</span>
              </div>
              {/* wait_time */}
              <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <label style={{ width: "40%" }}>wait_time</label>
                <input
                  type="range"
                  min={1}
                  max={120}
                  step={1}
                  value={kwargs.wait_time}
                  onChange={e => handleKwargChange("wait_time", Number(e.target.value))}
                  style={{ width: "40%" }}
                />
                <span style={{ width: 40 }}>{kwargs.wait_time}</span>
              </div>
            </div>
          </div>
        )}
        <div className="node-edit-modal-actions">
          <button className="cancel-node-btn" onClick={onClose}>Close</button>
          <button
            className="update-node-btn"
            onClick={isAddMode ? handleAdd : handleUpdate}
          >
            {isAddMode ? "Add Node" : "Update Node"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditModal;
