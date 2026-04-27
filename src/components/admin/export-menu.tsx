import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV, downloadXLSX, type ExportColumn } from "@/lib/exports";

interface ExportMenuProps<T> {
  filename: string;
  columns: ExportColumn<T>[];
  rows: T[];
  sheetName?: string;
  disabled?: boolean;
  size?: "sm" | "default";
}

export function ExportMenu<T>({
  filename,
  columns,
  rows,
  sheetName,
  disabled,
  size = "sm",
}: ExportMenuProps<T>) {
  const isEmpty = !rows || rows.length === 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={disabled || isEmpty}>
          <Download className="h-4 w-4" />
          <span className="ml-2">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadCSV(filename, columns, rows)}>
          <FileText className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadXLSX(filename, columns, rows, sheetName)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
