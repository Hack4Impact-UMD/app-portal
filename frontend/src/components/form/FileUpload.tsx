import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FullMetadata } from "firebase/storage";
import { DownloadIcon } from "lucide-react";
import React, { memo, useState } from "react";
import { Link } from "react-router-dom";

import Spinner from "@/components/Spinner";
import { throwErrorToast } from "@/components/toasts/ErrorToast";
import { throwSuccessToast } from "@/components/toasts/SuccessToast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  getFileMetadata,
  getFileURL,
  uploadFile,
} from "@/services/storageService";

import FormMarkdown from "./FormMarkdown";

type FileUploadProps = {
  question: string;
  disabled: boolean;
  required: boolean;
  errorMessage?: string;
  value: string;
  onChange: (fileName: string) => void;
  secondaryText?: string;
  fileId: string;
  responseId: string;
};

function useStorageFileMetadata(path: string) {
  return useQuery({
    queryKey: ["storage", "file", "path", path],
    enabled: !!path,
    queryFn: async () => {
      const meta = await getFileMetadata(path);
      const url = await getFileURL(path);
      return {
        ...meta,
        downloadUrl: url,
      };
    },
  });
}

function FileUpload(props: FileUploadProps) {
  const { data: fileMetadata, isPending } = useStorageFileMetadata(props.value);
  const [uploadProgess, setUploadProgess] = useState(0);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const fileUploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress: (progress: number) => void;
    }) => {
      if (user) {
        return await uploadFile(
          file,
          props.fileId + "/" + props.responseId,
          onProgress,
          {
            customMetadata: {
              name: file.name,
              ownerId: user.id,
            },
          },
        );
      } else {
        throw new Error("Not authenticated!");
      }
    },
    onMutate: async ({ file }) => {
      await queryClient.cancelQueries({
        queryKey: [
          "storage",
          "file",
          "path",
          props.fileId + "/" + props.responseId,
        ],
      });

      queryClient.setQueryData(
        ["storage", "file", "path", props.fileId + "/" + props.responseId],
        (old: FullMetadata) => ({
          ...(old || {}),
          customMetadata: {
            ...old?.customMetadata,
            name: file.name,
          },
        }),
      );
    },
    onSuccess: (data) => {
      setUploadProgess(1);
      props.onChange(data);
      throwSuccessToast("File upload successful!");
    },
    onError: (err) => {
      console.log(err);
      throwErrorToast("File upload failed!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "storage",
          "file",
          "path",
          props.fileId + "/" + props.responseId,
        ],
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeInBytes) {
        throwErrorToast("File size exceeds 10MB limit");
        return;
      }

      setUploadProgess(0);
      fileUploadMutation.mutate({
        file: file,
        onProgress: (prog) => setUploadProgess(prog),
      });
    }
  };

  return (
    <div>
      <div className="bg-lightgray flex flex-col hover:brightness-95 transition rounded-lg cursor-pointer overflow-hidden">
        <label
          htmlFor="resume-upload"
          className="flex items-start gap-4 p-4 py-7 cursor-pointer"
        >
          <div className="flex-shrink-0 mr-3">
            <svg
              width="70"
              height="70"
              viewBox="0 0 43 59"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M43 14.2926H30.7584C29.6801 14.29 28.8071 13.411 28.8045 12.3251V0.000264794L43 14.2926ZM43 16.2602V57.035C42.9974 58.1183 42.1245 59 41.0461 59H1.95386C0.875545 59 0.00256334 58.1184 0 57.035V1.96498C0.00256794 0.881685 0.875479 0 1.95386 0H26.8505L26.8531 12.3248C26.8556 14.4965 28.6015 16.2547 30.7581 16.2573L43 16.2602ZM10.5244 12.2734C10.5244 13.8505 11.4692 15.2752 12.9173 15.8801C14.3653 16.4851 16.0342 16.1516 17.1433 15.0347C18.2524 13.9178 18.5836 12.2398 17.9854 10.779C17.3872 9.32087 15.9725 8.36942 14.4038 8.36684C13.3768 8.36684 12.3884 8.77792 11.6618 9.50963C10.9326 10.2413 10.5244 11.2367 10.5244 12.2734ZM7.30743 26.9512H21.5005V22.3258C21.4928 19.7765 19.4414 17.7107 16.9098 17.703H11.8982C9.36665 17.7107 7.31269 19.7765 7.30756 22.3258L7.30743 26.9512ZM36.9331 50.6364C36.9331 49.7677 36.2347 49.0619 35.3721 49.0619H7.63081C6.76814 49.0619 6.0698 49.7677 6.0698 50.6364C6.0698 51.5051 6.76814 52.2084 7.63081 52.2084H35.3747C36.2374 52.2084 36.9331 51.5025 36.9331 50.6364ZM36.9331 42.7402C36.9331 41.8715 36.2347 41.1683 35.3721 41.1683H7.63081C6.76814 41.1683 6.0698 41.8715 6.0698 42.7402C6.0698 43.6089 6.76814 44.3148 7.63081 44.3148H35.3747C36.2374 44.3122 36.9331 43.6089 36.9331 42.7402ZM36.9331 34.8466C36.9331 34.4278 36.7688 34.0296 36.4761 33.7323C36.1834 33.4376 35.7854 33.2721 35.3721 33.2721H7.6308C6.76814 33.2721 6.06979 33.9779 6.06979 34.8466C6.06979 35.7153 6.76814 36.4186 7.6308 36.4186H35.3747C36.2374 36.4186 36.9331 35.7128 36.9331 34.8466ZM36.9331 26.9505C36.9331 26.0817 36.2347 25.3785 35.3721 25.3759H28.2322C27.3823 25.394 26.702 26.0947 26.702 26.9505C26.702 27.8063 27.3824 28.5069 28.2322 28.525H35.3721C35.7854 28.525 36.1834 28.3595 36.4761 28.0622C36.7688 27.7675 36.9331 27.3693 36.9331 26.9505Z"
                fill="#202020"
              />
            </svg>
          </div>

          <div className="flex flex-col text-left w-full justify-between min-h-[70px]">
            {isPending && props.value !== "" ? (
              <Spinner />
            ) : (
              <>
                <span className="font-semibold text-lg text-gray-900">
                  {props.question}
                </span>
                {props.secondaryText ? (
                  <FormMarkdown>{props.secondaryText}</FormMarkdown>
                ) : (
                  <></>
                )}
                {fileMetadata && (
                  <div className="w-full flex flex-row">
                    <span className="text-lg grow text-blue">
                      {fileMetadata.customMetadata?.name}
                    </span>
                    <Button asChild>
                      <Link
                        download
                        to={fileMetadata.downloadUrl}
                        target="_blank"
                      >
                        View
                        <DownloadIcon />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            className="hidden"
            required={props.required}
            disabled={props.disabled}
            onChange={handleFileChange}
          />
        </label>
        {fileUploadMutation.isPending && (
          <Progress value={uploadProgess * 100} />
        )}
      </div>
      {props.errorMessage && (
        <p className="text-red-600">{props.errorMessage}</p>
      )}
    </div>
  );
}

export default memo(FileUpload);
