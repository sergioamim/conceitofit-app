# Task ID: 511

**Title:** Adicionar tab "Credenciais" na página Admin WhatsApp existente

**Status:** pending

**Dependencies:** 510

**Priority:** medium

**Description:** Estender `src/app/(backoffice)/admin/whatsapp/page.tsx` com nova tab "Credenciais" integrando os componentes de gestão de credenciais WABA.

**Details:**

Em `src/app/(backoffice)/admin/whatsapp/page.tsx`:

1. A página já usa `Tabs` do shadcn com tabs: Templates, Logs, Configuração.
2. Adicionar nova tab "Credenciais" entre "Configuração" e o fim:

```tsx
<TabsTrigger value="credenciais">
  <ShieldCheck className="mr-2 size-4" />
  Credenciais
</TabsTrigger>
```

3. Conteúdo da tab:
```tsx
<TabsContent value="credenciais" className="space-y-4">
  <TokenExpiryAlert credentials={credentials} />
  <CredentialList
    credentials={credentials}
    isLoading={isLoading}
    onEdit={openEditCredential}
    onDelete={handleDelete}
    onHealthCheck={handleHealthCheck}
  />
  <Button onClick={openCreateCredential}>
    <Plus className="mr-2 size-4" />
    Nova Credencial
  </Button>
  <Dialog>
    <WhatsAppCredentialForm credential={editing} onSave={handleSave} onCancel={() => setDialogOpen(false)} />
  </Dialog>
</TabsContent>
```

4. Usar hooks `useWhatsAppCredentials`, `useCreateWhatsAppCredential`, etc. da Task 492.
5. Não quebrar funcionalidade existente das tabs Templates e Logs.

**Test Strategy:**

Teste manual: abrir `/admin/whatsapp` → navegar para tab Credenciais → verificar lista. Criar credencial → verificar que aparece. Health check → verificar badge. Deletar → verificar confirmação e remoção.
