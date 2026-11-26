import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DueDatePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-date`}>Date</Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id={`${id}-date`}
                disabled={disabled}
                className="w-32 justify-between font-normal"
              >
                {value.toLocaleDateString()}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={value}
                defaultMonth={value}
                disabled={{ before: new Date() }}
                onSelect={(newDate) => {
                  if (newDate) {
                    // The calendar returns midnight, so keep the chosen time.
                    const merged = new Date(newDate);
                    merged.setHours(
                      value.getHours(),
                      value.getMinutes(),
                      value.getSeconds(),
                      0,
                    );
                    onChange(merged);
                  }
                  setPopoverOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-time`}>Time</Label>
          <Input
            type="time"
            id={`${id}-time`}
            step="1"
            disabled={disabled}
            value={value.toTimeString().slice(0, 8)}
            onChange={(e) => {
              const [hours, minutes, seconds] = e.target.value
                .split(":")
                .map(Number);
              const newDate = new Date(value);
              newDate.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);
              onChange(newDate);
            }}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Due date is in {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </p>
    </div>
  );
}
