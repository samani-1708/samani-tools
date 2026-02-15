"use client";

// eslint-disable @typescript-eslint/no-empty-object-type

import { FileUploaded } from "@/app/common/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { SPLIT_MODE, SplitModes, UsePageRangesReturnType } from "../utils";
import { NPerPageIcon, RangeIcon } from "./icons";

type ControlsProps = {
  fileState: FileUploaded;
  totalPages: number;
  onPageSelectionChange?: (pageIndex: number, selected: boolean) => void;
} & UsePageRangesReturnType;

export function Controls(props: ControlsProps) {
  const { ranges, totalPages, mode, setRanges, setMode } = props;
  console.log("sameeksha ", totalPages)

  const [byPageMode, setByPageMode] = useState<"all" | "custom">("all");
  const [mergeIntoSingle, setMergeIntoSingle] = useState(false);

  function handleStartPageChange(
    _: React.ChangeEvent<HTMLInputElement>,
    index: number,
    boundary: number,
  ) {
    if (boundary >= 0 && boundary <= totalPages) {
      const page = boundary;
      if (page) {
        setRanges((prev) => {
          const newRanges = [...prev];
          newRanges[index] = [page, newRanges[index][1]];
          return newRanges;
        });
      }
    }
  }

  function handleEndPageChange(
    _: React.ChangeEvent<HTMLInputElement>,
    index: number,
    boundary: number,
  ) {
    if (boundary > 0 && boundary <= totalPages) {
      const page = boundary - 1;
      if (page) {
        setRanges((prev) => {
          const newRanges = [...prev];
          newRanges[index] = [newRanges[index][0], page];
          return newRanges;
        });
      }
    }
  }

  function handleAddRange() {
    setRanges((prev) => [...prev, [0, totalPages - 1]]);
  }

  function handleNPerPageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    const numValue = Number(value);
    if (!Number.isNaN(numValue) && numValue > 0) {
      const nextRanges = SPLIT_MODE.N_PER_PAGE.getRange(totalPages, numValue);
      setRanges(nextRanges);
    }
  }

  function onMergeChange(checked: boolean) {
    setMergeIntoSingle(!!checked);
  }

  function onTabChange(value: string) {
    const newMode = value.toUpperCase() as unknown as SplitModes;
    setMode(newMode);

    if (totalPages > 1) {
      switch (newMode) {
        case "RANGE":
          // For RANGE: single range with start and end page
          setRanges([[0, totalPages - 1]]);
          break;
        case "N_PER_PAGE":
          // For N_PER_PAGE: initially show all pages as one range
          setRanges([[0, totalPages - 1]]);
          break;
        case "BY_PAGE":
          // // For BY_PAGE: all pages as individual ranges
          // const allPagesRanges = fileState.pages.map((page) => [page]);
          // setRanges(allPagesRanges);
          break;
        case "BY_SIZE":
          // // For BY_SIZE: initially show all pages as one range
          // setRanges([[firstPage, lastPage]]);
          break;
        default:
          setRanges([[0, totalPages - 1]]);
      }
    }
  }

  console.log("debug::: controls ranges", ranges)

  return (
    <Tabs defaultValue={mode} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid  grid-cols-2 gap-2 min-h-14">
        <TabsTrigger value="RANGE" className="min-w-16 min-h-12">
          <RangeIcon className="size-8" /> {SPLIT_MODE.RANGE.category}
        </TabsTrigger>
        <TabsTrigger value="N_PER_PAGE" className="min-w-16">
          <NPerPageIcon className="size-8" />
          {SPLIT_MODE.N_PER_PAGE.category}
        </TabsTrigger>
        {/* <TabsTrigger value="BY_SIZE" className="min-w-16">{SPLIT_MODE.BY_SIZE.category}</TabsTrigger> */}
      </TabsList>

      <TabsContent value="RANGE" className="space-y-4 mt-6">
        {ranges.map((range, index) => {
          const startPage = range[0]  + 1
          const endPage = range[range.length - 1] + 1

          console.log("Debug:::", startPage, endPage)

          return (
            <div className="space-y-4" key={index} data-order={index}>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start_page">Start Page:</Label>
                  <Input
                    id="start_page"
                    type="number"
                    defaultValue={startPage}
                    onChange={(e) =>
                      handleStartPageChange(e, index, e.target.valueAsNumber)
                    }
                    placeholder="Start"
                    min="1"
                    max={totalPages}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_page">End Page:</Label>
                  <Input
                    id="end_page"
                    type="number"
                    defaultValue={endPage}
                    onChange={(e) =>
                      handleEndPageChange(e, index, e.target.valueAsNumber)
                    }
                    placeholder="End"
                    min="1"
                    max={totalPages}
                  />
                </div>
              </div>
              <div className="flex flex-row justify-end">
                <Button
                  onClick={handleAddRange}
                  disabled={typeof startPage !== "number" || typeof endPage !== "number"}
                  variant="outline"
                >
                  Add Range
                </Button>
              </div>
            </div>
          );
        })}
      </TabsContent>

      <TabsContent value="N_PER_PAGE" className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="pages_per_pdf">
            {SPLIT_MODE.N_PER_PAGE.message}:
          </Label>
          <Input
            id="pages_per_pdf"
            type="number"
            defaultValue={totalPages}
            onChange={handleNPerPageChange}
            placeholder="Pages per PDF"
            min="1"
            className="w-full"
          />
        </div>
      </TabsContent>

      <TabsContent value="BY_PAGE" className="space-y-4 mt-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <Label>Extract mode:</Label>
            <RadioGroup
              className="my-2"
              value={byPageMode}
              onValueChange={(value) =>
                setByPageMode(value as "all" | "custom")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="extract-all" />
                <Label htmlFor="extract-all">Extract all pages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="extract-custom" />
                <Label htmlFor="extract-custom">Custom pages</Label>
              </div>
            </RadioGroup>
          </div>

          {byPageMode === "custom" && (
            <div className="text-sm text-gray-600">
              Click on pages in the viewer to select/deselect them. Selected:{" "}
              {ranges.length} page
              {ranges.length !== 1 ? "s" : ""}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="merge_single"
              checked={mergeIntoSingle}
              onCheckedChange={onMergeChange}
            />
            <Label htmlFor="merge_single">Merge into single PDF</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
