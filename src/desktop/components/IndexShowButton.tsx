import React, { useState } from "react";

import { Button, Stack } from "@mui/material";
import { Oval } from "react-loader-spinner";

interface IndexShowButtonProps {
  onClick: () => Promise<void>;
  buttonLabel?: string;
}

const IndexShowButton: React.FC<IndexShowButtonProps> = ({
  onClick,
  buttonLabel = "メッセージを表示",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error("エラーが発生しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        disabled={isLoading}
      >
        {buttonLabel}
      </Button>
      {isLoading && (
        <Oval
          height={24}
          width={24}
          color="#1976d2"
          visible
          ariaLabel="loading-indicator"
          secondaryColor="#e3f2fd"
          strokeWidth={2}
          strokeWidthSecondary={2}
        />
      )}
    </Stack>
  );
};

export default IndexShowButton;
