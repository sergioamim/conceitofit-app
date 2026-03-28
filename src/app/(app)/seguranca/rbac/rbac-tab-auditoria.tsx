import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import type { RbacAuditoriaItem } from "@/lib/types";

type RbacTabAuditoriaProps = {
  logs: RbacAuditoriaItem[];
  action: string;
  resourceType: string;
  limit: number;
  logsLoading: boolean;
  logsError: string | null;
  setAction: (value: string) => void;
  setResourceType: (value: string) => void;
  setLimit: (value: number) => void;
};

export function RbacTabAuditoria({
  logs,
  action,
  resourceType,
  limit,
  logsLoading,
  logsError,
  setAction,
  setResourceType,
  setLimit,
}: RbacTabAuditoriaProps) {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Auditoria de permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</label>
              <Input value={action} onChange={(event) => setAction(event.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resource type</label>
              <Input
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
                className="bg-secondary border-border"
                placeholder="ex: feature, perfil"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Limite</label>
              <Select
                value={String(limit)}
                onValueChange={(nextValue) => setLimit(Number(nextValue))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SecuritySectionFeedback loading={logsLoading} error={logsError} />

          <PaginatedTable
            columns={[
              { label: "createdAt" },
              { label: "Action" },
              { label: "Recurso" },
              { label: "Usuário" },
              { label: "Detalhes", className: "w-64" },
            ]}
            items={logs}
            getRowKey={(item) => item.id}
            emptyText="Nenhum evento encontrado."
            showPagination={false}
            renderCells={(item) => (
              <>
                <TableCell className="px-3 py-2">{item.createdAt}</TableCell>
                <TableCell className="px-3 py-2">{item.action}</TableCell>
                <TableCell className="px-3 py-2">{item.resourceType}</TableCell>
                <TableCell className="px-3 py-2">{item.actorName ?? item.actorEmail ?? "—"}</TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground">{item.detalhes ?? "—"}</TableCell>
              </>
            )}
          />
        </CardContent>
      </Card>
    </section>
  );
}
