import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllApplicationForms } from "@/hooks/useApplicationForm";

interface FormSelectProps {
  selectedId?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function FormSelect({
  selectedId,
  onValueChange,
  className,
}: FormSelectProps) {
  const { data: forms, isPending, error } = useAllApplicationForms();

  if (isPending) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading forms..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error || !forms) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Error loading forms" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedId} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a form" />
      </SelectTrigger>
      <SelectContent>
        {forms.map((form) => (
          <SelectItem key={form.id} value={form.id}>
            {form.isActive && <span className="text-blue">●</span>}
            {form.semester} ({form.id})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
