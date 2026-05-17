import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowDashboard(false);
      })
  );

  return (
    <div>
      {!showDashboard ? (
        <Button
          type="button"
          onClick={() => setShowDashboard(true)}
          className={buttonClassName}
        >
          {children}
        </Button>
      ) : (
        <div className="rounded-xl overflow-hidden border border-border">
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            height={320}
            width="100%"
          />
          <div className="flex justify-end px-3 pb-3 bg-[#1f1f1f]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
              onClick={() => setShowDashboard(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
