import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import {
  E2E_ADMIN_USER,
  E2E_CANCHA_SPACE,
  E2E_INTERNAL_USER,
  createPendingSpaceSolicitud,
  disconnectE2EPrisma,
  ensureE2EBaseData,
  nextDateInput,
  resetE2EFlowData,
  waitForReserva,
  waitForSolicitudByDetail,
  waitForSolicitudEstado,
} from "./helpers/db";

test.beforeAll(async () => {
  await ensureE2EBaseData();
});

test.beforeEach(async () => {
  await resetE2EFlowData();
});

test.afterAll(async () => {
  await disconnectE2EPrisma();
});

test("internal envia solicitud de espacio desde formulario", async ({ page }) => {
  await loginAs(page, E2E_INTERNAL_USER.email, E2E_INTERNAL_USER.password);

  await page.goto("/calendario/cancha");

  const fechaIngreso = page.getByLabel("Fecha de ingreso solicitud");
  await expect(fechaIngreso).toHaveJSProperty("readOnly", true);

  const marker = `e2e-ui-${Date.now()}`;

  await page.getByLabel("Espacio solicitado").selectOption(E2E_CANCHA_SPACE.id);
  await page.getByLabel("Fecha del evento").fill(nextDateInput(2));
  await page.getByLabel("Hora inicio").fill("10:00");
  await page.getByLabel("Hora termino").fill("11:00");
  await page.getByLabel("Descripcion de solicitud").fill(marker);

  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Solicitud enviada")).toBeVisible();

  const solicitud = await waitForSolicitudByDetail(marker);
  expect(solicitud).not.toBeNull();
  expect(solicitud?.estado).toBe("RECIBIDA");
  expect(solicitud?.espacioSolicitadoId).toBe(E2E_CANCHA_SPACE.id);
  expect(solicitud?.fechaInicioSolicitada).not.toBeNull();
  expect(solicitud?.fechaFinSolicitada).not.toBeNull();

  await page.goto("/solicitudes");
  await expect(page.getByText(marker)).toBeVisible();
});

test("admin aprueba solicitud pendiente y crea reserva", async ({ page }) => {
  const seed = await createPendingSpaceSolicitud({
    titleSuffix: `aprobacion-${Date.now()}`,
    detail: `e2e-approve-${Date.now()}`,
    daysFromNow: 2,
    startHour: 11,
    durationHours: 1,
  });

  await loginAs(page, E2E_ADMIN_USER.email, E2E_ADMIN_USER.password);
  await page.goto("/solicitudes-admin");

  const row = page.getByTestId(`pending-solicitud-${seed.solicitudId}`);
  await expect(row).toBeVisible();

  await row.getByTestId(`approve-solicitud-${seed.solicitudId}`).click();

  const solicitudAprobada = await waitForSolicitudEstado(seed.solicitudId, "APROBADA");
  expect(solicitudAprobada).not.toBeNull();

  const reserva = await waitForReserva({
    userId: seed.userId,
    espacioId: seed.espacioId,
    start: seed.start,
    end: seed.end,
  });
  expect(reserva).not.toBeNull();

  await page.goto("/calendario");
  await expect(page.getByText("Solicitudes de espacio pendientes", { exact: true })).toBeVisible();
  await expect(page.getByText("Próximas reservas y eventos", { exact: true })).toBeVisible();
  await expect(page.locator('a[href="/calendario/cancha"]')).toHaveCount(0);
  await expect(page.locator('a[href="/calendario/salon-multiuso"]')).toHaveCount(0);
});

test("admin rechaza solicitud y solicitante la ve en historial", async ({ page }) => {
  const seed = await createPendingSpaceSolicitud({
    titleSuffix: `rechazo-${Date.now()}`,
    detail: `e2e-reject-${Date.now()}`,
    daysFromNow: 3,
    startHour: 15,
    durationHours: 1,
  });

  await loginAs(page, E2E_ADMIN_USER.email, E2E_ADMIN_USER.password);
  await page.goto("/solicitudes-admin");

  const row = page.getByTestId(`pending-solicitud-${seed.solicitudId}`);
  await expect(row).toBeVisible();

  await row.getByTestId(`reject-solicitud-${seed.solicitudId}`).click();

  const solicitudRechazada = await waitForSolicitudEstado(seed.solicitudId, "RECHAZADA");
  expect(solicitudRechazada).not.toBeNull();

  await page.context().clearCookies();
  await loginAs(page, E2E_INTERNAL_USER.email, E2E_INTERNAL_USER.password);

  await page.goto("/solicitudes");
  await expect(page.getByText("Historial de solicitudes")).toBeVisible();
  await expect(page.getByText(seed.title)).toBeVisible();
  await expect(page.getByText("Rechazada")).toBeVisible();
});
