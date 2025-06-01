import React from "react";

interface PopupProps {
  message: string;
  error?: boolean;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, error, onClose }) => (
  <div className={`popup${error ? " error" : ""}`}>
    <span>{message}</span>
    <button className="popup-close" onClick={onClose}>
      ×
    </button>
  </div>
);

export default Popup;
