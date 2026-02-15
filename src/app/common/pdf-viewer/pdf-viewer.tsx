"use client";

import React, { useState } from "react";
import { Document, DocumentProps, Page, pdfjs } from "react-pdf";
import "./pdf-viewer.css";
import { getPageOverlayProps } from "./utils";
import { PDFStateError, PDFStatePending } from "./pdf-states";

{
  if (!Promise.withResolvers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Promise as any).withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  pdfjs.GlobalWorkerOptions.workerSrc = `/js/pdf-worker/${pdfjs.version}/pdf-worker.min.js`;
}
interface ViewPDFOwnProps {
  src: string | File;
  onLoadSuccess?: DocumentProps["onLoadSuccess"];
  onError?: (error: Error) => void;
  textLayer?: boolean;
  annotationLayer?: boolean;
  width?: number;
  range?: number[];
  forceRefresh?: boolean;
  classes?: {
    wrapper?: string;
    page?: string;
  };
  overlayMode?: "hover" | "always";
  defaultOverrides?: {
    width?: string | number;
    height?: string | number;
    pageBorder?: string;
    pageBetweenMargin?: string | number;
    pageBoxShadow?: string;
    pageBorderRadius?: string | number;
  };
}

type ViewPDFProps = ViewPDFOwnProps & {
  children?: React.ReactNode | ((pageIndex: number) => React.ReactNode);
};

/**
 * Wraps children in a single <Document> so child <Page> components
 * share one loaded PDF — no re-parse on mount/unmount.
 */
export function PDFDocumentProvider({
  src,
  children,
  onLoad,
}: {
  src: string | File;
  children: React.ReactNode;
  onLoad?: DocumentProps["onLoadSuccess"];
}) {
  return (
    <Document
      file={src}
      loading={null}
      onLoadSuccess={onLoad}
      className="view-pdf w-full h-full flex flex-col z-0"
    >
      {children}
    </Document>
  );
}

/**
 * Lightweight memoized page thumbnail — must be rendered
 * inside a <PDFDocumentProvider> (or react-pdf <Document>).
 */
export const PDFPageThumbnail = React.memo(function PDFPageThumbnail({
  pageIndex,
  width,
}: {
  pageIndex: number;
  width: number;
}) {
  return (
    <Page
      pageNumber={pageIndex + 1}
      width={width}
      renderTextLayer={false}
      renderAnnotationLayer={false}
      _className="react_pdf_page"
    />
  );
});

export default function ViewPDF(props: ViewPDFProps) {
  const {
    src,
    onLoadSuccess: onLoad,
    onError,
    textLayer = false,
    annotationLayer = false,
    width,
    range,
    forceRefresh = false,
    children = null,
    classes,
    overlayMode = "hover",
  } = props;

  const [numberOfPages, setNumberOfPages] = useState(0);

  const onLoadSuccess: DocumentProps["onLoadSuccess"] = (success) => {
    onLoad?.(success);
    setNumberOfPages(success.numPages);
  };

  const onPDFError = (error: Error) => {
    onError?.(error);
  };

  const renderRange = range
    ? range
    : Array.from({ length: numberOfPages }, (_, i) => i);

  let jsx = null;



  const styles = {
    "--page-between-margin": props.defaultOverrides?.pageBetweenMargin || "20px",
    "--page-border-radius": props.defaultOverrides?.pageBorderRadius || "8px",
    "--page-border": props.defaultOverrides?.pageBorder || "1px solid oklch(96.7% 0.003 264.542)",
    "--page-border-shadow":
      props.defaultOverrides?.pageBoxShadow || "0 4px 6px -1px rgb(0 0 0 / 0.1),\n    0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "--page-width": props.defaultOverrides?.width || "100%",
    "--page-height": props.defaultOverrides?.height || "100%",
  } as React.CSSProperties;


  if (numberOfPages > 0) {
    jsx = renderRange.map((pageIndex, index) => {
      let childrenJSX = null;

      const isChildrenFn = typeof children === "function";

      if (isChildrenFn) {
        childrenJSX = (
          <div
            className={`react_page__overlay ${
              overlayMode === "always" ? "react_page__overlay--always" : ""
            }`}
            {...getPageOverlayProps(pageIndex)}
          >
            {children(pageIndex)}
          </div>
        );
      } else if (children) {
        childrenJSX = children;
      }

      return (
        <Page
          key={`page_${pageIndex + 1}_${index}`}
          pageNumber={pageIndex + 1}
          _className="react_pdf_page"
          width={width}
          renderTextLayer={textLayer}
          renderAnnotationLayer={annotationLayer}
        >
          {childrenJSX}
        </Page>
      );
    });
  }





  return (
    <div
      className="w-full h-full view-pdf-wrapper"
      style={styles}
    >
      <Document
        className={
          "view-pdf w-full h-full flex flex-col z-0" +
          // !Note: ` ${classes.wrapper} ` space is intended before and after the wrapper class, lib appends __
          (classes?.wrapper ? ` ${classes.wrapper} ` : "")
        }
        error={
          <PDFStateError
            header="Failed to load file"
            subHeader="Some error has occured while loading the files"
          />
        }
        loading={<PDFStatePending header="Loading file" subHeader="" />}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onPDFError}
        onError={onPDFError}
        file={src}
        key={forceRefresh ? Math.random() : undefined}
      >
        {jsx}
      </Document>
    </div>
  );
}
