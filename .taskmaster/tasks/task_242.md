# Task ID: 242

**Title:** Página "Check-in" digital no portal do aluno

**Status:** done

**Dependencies:** 239 ✓

**Priority:** medium

**Description:** QR Code gerado para o aluno. Histórico de presenças.

**Details:**

Gerar QR code com identificador do aluno (usar lib qrcode ou similar). Exibir QR para leitura na recepção. Histórico de presenças via API GET /api/v1/presencas?alunoId=. Exibir data, hora, tipo (CHECKIN, AULA, ACESSO).

**Test Strategy:**

QR code renderiza. Histórico lista presenças.
