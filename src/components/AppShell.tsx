"use client";

import {
  BookmarkIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  programLabel?: string;
  episodeLabel?: string | null;
  sectionLabel?: string | null;
  authorName: string;
  lastUpdated?: string | null;
  onAuthorClick: () => void;
  onPreview?: () => void;
  onCommit?: () => void;
  onExportMarkdown?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  programLabel = "ADS",
  episodeLabel,
  sectionLabel,
  authorName,
  lastUpdated,
  onAuthorClick,
  onPreview,
  onCommit,
  onExportMarkdown,
  children,
}: Props) {
  return (
    <div className="flex h-screen flex-col bg-[#f0f2f5] text-foreground">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink className="text-muted-foreground hover:text-foreground">
                {programLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {episodeLabel && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRightIcon className="size-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-medium text-primary">
                    {episodeLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {sectionLabel && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRightIcon className="size-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">{sectionLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex shrink-0 items-center gap-1.5">
          {lastUpdated && (
            <span className="mr-1 hidden text-[10px] text-muted-foreground sm:inline">
              {lastUpdated} 更新
            </span>
          )}
          {onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              <EyeIcon className="size-3.5" />
              確認
            </Button>
          )}
          {onExportMarkdown && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex">
                <Button variant="outline" size="sm" type="button">
                  <DownloadIcon className="size-3.5" />
                  書き出し
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportMarkdown}>
                  Markdown（講義形式）
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onCommit && (
            <Button size="sm" onClick={onCommit}>
              <BookmarkIcon className="size-3.5" />
              記録
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAuthorClick}
            className="text-muted-foreground"
          >
            <UserIcon className="size-3.5" />
            <span className="max-w-[4rem] truncate">{authorName || "名前"}</span>
          </Button>
        </div>
      </header>

      <div className={cn("flex min-h-0 flex-1 overflow-hidden p-0")}>{children}</div>
    </div>
  );
}
