import React from "react";
import ReactDOM from "react-dom/client";

import ExecutionButton from "./IndexShowButton";

/**
 * @description Kintoneのレコード一覧画面にボタンを表示するReactコンポーネントをレンダリングします。
 */
export const renderExecutionButton = (
  elementId: string,
  onClick: () => Promise<void>,
  buttonLabel: string,
) => {
  const headerSpaceElement = kintone.app.getHeaderSpaceElement();
  if (!headerSpaceElement) {
    console.error("Header space element not found.");
    return;
  }

  const existingButtonRoot = document.getElementById(elementId);
  if (existingButtonRoot && headerSpaceElement.contains(existingButtonRoot)) {
    headerSpaceElement.removeChild(existingButtonRoot);
  }

  const buttonRoot = document.createElement("div");
  buttonRoot.id = elementId;
  buttonRoot.style.display = "inline-block";
  buttonRoot.style.marginLeft = "10px";
  headerSpaceElement.appendChild(buttonRoot);

  const handleClick = async () => {
    try {
      await onClick();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const root = ReactDOM.createRoot(buttonRoot);
  root.render(
    React.createElement(ExecutionButton, {
      onClick: handleClick,
      buttonLabel,
    }),
  );
};
