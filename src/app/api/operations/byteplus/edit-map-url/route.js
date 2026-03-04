import { NextResponse } from 'next/server';

const BYTEPLUS_ADMIN_BASE_URL = 'http://10.224.100.4:8005';

function normalizeHost(inputUrl) {
    const raw = (inputUrl || '').trim().toLowerCase();
    return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function normalizeNamePart(host) {
    return host.replace(/[^a-z0-9._-]/g, '_');
}

function normalizePath(inputPath) {
    const raw = (inputPath || '/').trim();
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
}

function validateEndpoint(endpoint) {
    const trimmed = (endpoint || '').trim();
    if (!trimmed) return false;

    const parts = trimmed.split(':');
    if (parts.length !== 2) return false;

    const port = Number(parts[1]);
    return Boolean(parts[0]) && Number.isInteger(port) && port > 0 && port <= 65535;
}

async function sendForm(url, method, body) {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body ? new URLSearchParams(body).toString() : undefined,
        cache: 'no-store',
    });
}

async function getJsonOrText(response) {
    const text = await response.text();
    try {
        return { text, json: JSON.parse(text) };
    } catch {
        return { text, json: null };
    }
}

function extractMessage(json, fallbackText, fallbackMessage) {
    if (json?.message) return json.message;
    if (fallbackText) return fallbackText;
    return fallbackMessage;
}

async function fetchRouteAndService(fqdn) {
    const host = normalizeHost(fqdn);
    const namePart = normalizeNamePart(host);
    const routeName = `route_${namePart}`;
    const serviceName = `svc_${namePart}`;

    const routeResponse = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/routes/${routeName}`, { cache: 'no-store' });
    const routePayload = await getJsonOrText(routeResponse);
    if (!routeResponse.ok) {
        if (routeResponse.status === 404) {
            const serviceByNameResponse = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/services/${serviceName}`, { cache: 'no-store' });
            const serviceByNamePayload = await getJsonOrText(serviceByNameResponse);

            if (serviceByNameResponse.ok && serviceByNamePayload.json) {
                const protocol = serviceByNamePayload.json?.protocol || 'http';
                const serviceHost = serviceByNamePayload.json?.host || '';
                const servicePort = serviceByNamePayload.json?.port || '';
                const servicePath = normalizePath(serviceByNamePayload.json?.path || '/');

                return {
                    ok: true,
                    host,
                    routeName,
                    routeId: null,
                    routeMissing: true,
                    serviceId: serviceByNamePayload.json?.id,
                    serviceName,
                    scheme: protocol,
                    endpoint: `${serviceHost}:${servicePort}`,
                    path: servicePath,
                    routeData: null,
                    serviceData: serviceByNamePayload.json,
                };
            }

            return {
                ok: false,
                status: 404,
                message: `ไม่พบ FQDN นี้ในระบบ (${host}) กรุณาสร้าง mapping ก่อน`,
            };
        }

        return {
            ok: false,
            status: routeResponse.status,
            message: `Fetch route failed: ${extractMessage(routePayload.json, routePayload.text, 'Route not found')}`,
        };
    }

    const serviceId = routePayload.json?.service?.id;
    if (!serviceId) {
        return {
            ok: false,
            status: 500,
            message: 'Route found but service id is missing',
        };
    }

    const serviceResponse = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/services/${serviceId}`, { cache: 'no-store' });
    const servicePayload = await getJsonOrText(serviceResponse);
    if (!serviceResponse.ok) {
        return {
            ok: false,
            status: serviceResponse.status,
            message: `Fetch service failed: ${extractMessage(servicePayload.json, servicePayload.text, 'Service not found')}`,
        };
    }

    const protocol = servicePayload.json?.protocol || 'http';
    const serviceHost = servicePayload.json?.host || '';
    const servicePort = servicePayload.json?.port || '';
    const servicePath = normalizePath(servicePayload.json?.path || '/');

    return {
        ok: true,
        host,
        routeName,
        routeId: routePayload.json?.id,
        routeMissing: false,
        serviceId,
        serviceName,
        scheme: protocol,
        endpoint: `${serviceHost}:${servicePort}`,
        path: servicePath,
        routeData: routePayload.json,
        serviceData: servicePayload.json,
    };
}

export async function POST(request) {
    try {
        const { action, fqdn, scheme, endpoint, path } = await request.json();

        if (!action) {
            return NextResponse.json({ success: false, message: 'Missing required field: action' }, { status: 400 });
        }

        if (!fqdn) {
            return NextResponse.json({ success: false, message: 'Missing required field: fqdn' }, { status: 400 });
        }

        const current = await fetchRouteAndService(fqdn);
        if (!current.ok) {
            return NextResponse.json({ success: false, message: current.message }, { status: current.status || 500 });
        }

        if (action === 'fetch') {
            return NextResponse.json({
                success: true,
                fqdn: current.host,
                scheme: current.scheme,
                endpoint: current.endpoint,
                path: current.path,
                routeName: current.routeName,
                routeMissing: Boolean(current.routeMissing),
                serviceId: current.serviceId,
            });
        }

        if (action === 'edit') {
            const normalizedScheme = (scheme || '').trim().toLowerCase();
            if (!['http', 'https'].includes(normalizedScheme)) {
                return NextResponse.json({ success: false, message: 'Invalid scheme. Allowed values: http, https' }, { status: 400 });
            }

            if (!validateEndpoint(endpoint)) {
                return NextResponse.json({ success: false, message: 'Invalid endpoint format. Use <ip>:<port>.' }, { status: 400 });
            }

            const normalizedPath = normalizePath(path);
            const targetUrl = `${normalizedScheme}://${endpoint}${normalizedPath}`;

            const servicePatch = await sendForm(`${BYTEPLUS_ADMIN_BASE_URL}/services/${current.serviceId}`, 'PATCH', {
                url: targetUrl,
            });
            const servicePatchPayload = await getJsonOrText(servicePatch);
            if (!servicePatch.ok) {
                return NextResponse.json({
                    success: false,
                    message: `Edit service failed: ${extractMessage(servicePatchPayload.json, servicePatchPayload.text, 'Unknown upstream error')}`,
                }, { status: servicePatch.status || 500 });
            }

            if (current.routeMissing) {
                const routeCreate = await sendForm(`${BYTEPLUS_ADMIN_BASE_URL}/services/${current.serviceId}/routes`, 'POST', {
                    'hosts[]': current.host,
                    preserve_host: 'true',
                    name: current.routeName,
                });
                const routeCreatePayload = await getJsonOrText(routeCreate);
                if (!routeCreate.ok) {
                    return NextResponse.json({
                        success: false,
                        message: `Create missing route failed: ${extractMessage(routeCreatePayload.json, routeCreatePayload.text, 'Unknown upstream error')}`,
                    }, { status: routeCreate.status || 500 });
                }
            } else {
                const routePatch = await sendForm(`${BYTEPLUS_ADMIN_BASE_URL}/routes/${current.routeName}`, 'PATCH', {
                    'hosts[]': current.host,
                    preserve_host: 'true',
                    name: current.routeName,
                });
                const routePatchPayload = await getJsonOrText(routePatch);
                if (!routePatch.ok) {
                    return NextResponse.json({
                        success: false,
                        message: `Edit route failed: ${extractMessage(routePatchPayload.json, routePatchPayload.text, 'Unknown upstream error')}`,
                    }, { status: routePatch.status || 500 });
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Edit URL to endpoint สำเร็จ',
                fqdn: current.host,
                routeName: current.routeName,
                routeMissingRepaired: Boolean(current.routeMissing),
                targetUrl,
            });
        }

        if (action === 'delete') {
            if (!current.routeMissing) {
                const routeDelete = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/routes/${current.routeName}`, {
                    method: 'DELETE',
                    cache: 'no-store',
                });

                if (!routeDelete.ok && routeDelete.status !== 404) {
                    const routeDeletePayload = await getJsonOrText(routeDelete);
                    return NextResponse.json({
                        success: false,
                        message: `Delete route failed: ${extractMessage(routeDeletePayload.json, routeDeletePayload.text, 'Unknown upstream error')}`,
                    }, { status: routeDelete.status || 500 });
                }
            }

            const serviceDelete = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/services/${current.serviceId}`, {
                method: 'DELETE',
                cache: 'no-store',
            });

            if (!serviceDelete.ok && serviceDelete.status !== 404) {
                const serviceDeletePayload = await getJsonOrText(serviceDelete);
                return NextResponse.json({
                    success: false,
                    message: `Delete service failed: ${extractMessage(serviceDeletePayload.json, serviceDeletePayload.text, 'Unknown upstream error')}`,
                }, { status: serviceDelete.status || 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Delete URL to endpoint สำเร็จ',
                fqdn: current.host,
                routeName: current.routeName,
                serviceId: current.serviceId,
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid action. Allowed values: fetch, edit, delete' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
