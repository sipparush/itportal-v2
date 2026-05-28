import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const KONG_ADMIN_BASE_URL = 'https://kong-admin.jfin.network';

function normalizePath(inputPath) {
    const raw = (inputPath || '/').trim();
    if (!raw) return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
}

function normalizeName(value) {
    return (value || '').trim();
}

function isValidName(value) {
    return /^[A-Za-z0-9._-]+$/.test(value);
}

function validateEndpoint(destinationIp, destinationPort) {
    const host = (destinationIp || '').trim();
    const port = Number(destinationPort);

    return Boolean(host) && Number.isInteger(port) && port > 0 && port <= 65535;
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

async function fetchServiceByName(serviceName) {
    const normalizedName = normalizeName(serviceName);
    const response = await fetch(`${KONG_ADMIN_BASE_URL}/services/${encodeURIComponent(normalizedName)}`, {
        cache: 'no-store',
    });
    const payload = await getJsonOrText(response);

    return {
        ok: response.ok,
        status: response.status,
        data: payload.json,
        message: response.ok ? null : extractMessage(payload.json, payload.text, 'Service not found'),
    };
}

async function fetchRouteByName(routeName) {
    const normalizedName = normalizeName(routeName);
    const response = await fetch(`${KONG_ADMIN_BASE_URL}/routes/${encodeURIComponent(normalizedName)}`, {
        cache: 'no-store',
    });
    const payload = await getJsonOrText(response);

    return {
        ok: response.ok,
        status: response.status,
        data: payload.json,
        message: response.ok ? null : extractMessage(payload.json, payload.text, 'Route not found'),
    };
}

function buildCurrentMapping(service, route, serviceNameFallback, routeNameFallback) {
    return {
        ok: true,
        service,
        route,
        serviceName: service?.name || serviceNameFallback || '',
        routeName: route?.name || routeNameFallback || '',
        protocol: service?.protocol || 'http',
        destinationIp: service?.host || '',
        destinationPort: service?.port || '',
        path: normalizePath(route?.paths?.[0] || service?.path || '/'),
        fqdn: route?.hosts?.[0] || '',
    };
}

async function fetchRouteAndServiceByName(serviceName, routeName) {
    const normalizedServiceName = normalizeName(serviceName);
    const normalizedRouteName = normalizeName(routeName);

    if (normalizedServiceName && normalizedRouteName) {
        const serviceResult = await fetchServiceByName(normalizedServiceName);
        if (!serviceResult.ok) {
            return {
                ok: false,
                status: serviceResult.status,
                message: `Fetch service failed: ${serviceResult.message || 'Service not found'}`,
            };
        }

        const routeResult = await fetchRouteByName(normalizedRouteName);
        if (!routeResult.ok) {
            return {
                ok: false,
                status: routeResult.status,
                message: `Fetch route failed: ${routeResult.message || 'Route not found'}`,
            };
        }

        const service = serviceResult.data;
        const route = routeResult.data;
        const routeServiceId = route?.service?.id;

        if (!service?.id || !routeServiceId) {
            return {
                ok: false,
                status: 500,
                message: 'Service or route payload is missing required identifiers',
            };
        }

        if (routeServiceId !== service.id) {
            return {
                ok: false,
                status: 409,
                message: 'The provided route name is not linked to the provided service name',
            };
        }

        return buildCurrentMapping(service, route, normalizedServiceName, normalizedRouteName);
    }

    if (normalizedServiceName) {
        const serviceResult = await fetchServiceByName(normalizedServiceName);
        if (!serviceResult.ok) {
            return {
                ok: false,
                status: serviceResult.status,
                message: `Fetch service failed: ${serviceResult.message || 'Service not found'}`,
            };
        }

        const routesResponse = await fetch(`${KONG_ADMIN_BASE_URL}/services/${encodeURIComponent(normalizedServiceName)}/routes`, {
            cache: 'no-store',
        });
        const routesPayload = await getJsonOrText(routesResponse);

        if (!routesResponse.ok) {
            return {
                ok: false,
                status: routesResponse.status,
                message: `Fetch service routes failed: ${extractMessage(routesPayload.json, routesPayload.text, 'Route lookup failed')}`,
            };
        }

        const routes = Array.isArray(routesPayload.json?.data) ? routesPayload.json.data : [];
        if (routes.length === 0) {
            return {
                ok: false,
                status: 404,
                message: 'Service found but no routes configured',
            };
        }

        if (routes.length > 1) {
            return {
                ok: false,
                status: 409,
                message: 'Service has multiple routes - specify route name to disambiguate',
            };
        }

        return buildCurrentMapping(serviceResult.data, routes[0], normalizedServiceName, routes[0]?.name || '');
    }

    if (normalizedRouteName) {
        const routeResult = await fetchRouteByName(normalizedRouteName);
        if (!routeResult.ok) {
            return {
                ok: false,
                status: routeResult.status,
                message: `Fetch route failed: ${routeResult.message || 'Route not found'}`,
            };
        }

        const linkedServiceId = routeResult.data?.service?.id;
        if (!linkedServiceId) {
            return {
                ok: false,
                status: 500,
                message: 'Route payload is missing linked service identifier',
            };
        }

        const linkedServiceResponse = await fetch(`${KONG_ADMIN_BASE_URL}/services/${encodeURIComponent(linkedServiceId)}`, {
            cache: 'no-store',
        });
        const linkedServicePayload = await getJsonOrText(linkedServiceResponse);

        if (!linkedServiceResponse.ok) {
            return {
                ok: false,
                status: linkedServiceResponse.status,
                message: `Fetch linked service failed: ${extractMessage(linkedServicePayload.json, linkedServicePayload.text, 'Service not found')}`,
            };
        }

        return buildCurrentMapping(linkedServicePayload.json, routeResult.data, linkedServicePayload.json?.name || '', normalizedRouteName);
    }

    return {
        ok: false,
        status: 400,
        message: 'Missing required fields: provide serviceName, routeName, or both',
    };
}

async function handleActionRequest(body) {
    const action = normalizeName(body.action).toLowerCase();
    const serviceName = normalizeName(body.serviceName);
    const routeName = normalizeName(body.routeName);

    if (!['fetch', 'edit', 'delete'].includes(action)) {
        return NextResponse.json(
            { success: false, message: 'Invalid action. Allowed values: fetch, edit, delete' },
            { status: 400 }
        );
    }

    if (!serviceName && !routeName) {
        return NextResponse.json(
            { success: false, message: 'Missing required fields: provide serviceName, routeName, or both' },
            { status: 400 }
        );
    }

    if ((serviceName && !isValidName(serviceName)) || (routeName && !isValidName(routeName))) {
        return NextResponse.json(
            { success: false, message: 'Invalid serviceName or routeName format' },
            { status: 400 }
        );
    }

    const current = await fetchRouteAndServiceByName(serviceName, routeName);
    if (!current.ok) {
        return NextResponse.json(
            { success: false, message: current.message },
            { status: current.status || 500 }
        );
    }

    if (action === 'fetch') {
        return NextResponse.json({
            success: true,
            serviceName: current.serviceName,
            routeName: current.routeName,
            fqdn: current.fqdn,
            scheme: current.protocol,
            destinationIp: current.destinationIp,
            destinationPort: current.destinationPort,
            path: current.path,
        });
    }

    if (action === 'edit') {
        const scheme = normalizeName(body.scheme || current.protocol).toLowerCase();
        const destinationIp = normalizeName(body.destinationIp || current.destinationIp);
        const destinationPort = body.destinationPort ?? current.destinationPort;
        const path = normalizePath(body.path || current.path);

        if (!['http', 'https'].includes(scheme)) {
            return NextResponse.json(
                { success: false, message: 'Invalid scheme. Allowed values: http, https' },
                { status: 400 }
            );
        }

        if (!validateEndpoint(destinationIp, destinationPort)) {
            return NextResponse.json(
                { success: false, message: 'Invalid destination. Please provide destinationIp and destinationPort.' },
                { status: 400 }
            );
        }

        const targetUrl = `${scheme}://${destinationIp}:${destinationPort}${path}`;

        const servicePatchResponse = await sendForm(
            `${KONG_ADMIN_BASE_URL}/services/${encodeURIComponent(current.serviceName)}`,
            'PATCH',
            { url: targetUrl }
        );
        const servicePatchPayload = await getJsonOrText(servicePatchResponse);

        if (!servicePatchResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Edit service failed: ${extractMessage(servicePatchPayload.json, servicePatchPayload.text, 'Unknown upstream error')}`,
                },
                { status: servicePatchResponse.status || 500 }
            );
        }

        const routePatchBody = {
            name: current.routeName,
            preserve_host: 'true',
        };

        if (current.fqdn) {
            routePatchBody['hosts[]'] = current.fqdn;
        }

        routePatchBody['paths[]'] = path;

        const routePatchResponse = await sendForm(
            `${KONG_ADMIN_BASE_URL}/routes/${encodeURIComponent(current.routeName)}`,
            'PATCH',
            routePatchBody
        );
        const routePatchPayload = await getJsonOrText(routePatchResponse);

        if (!routePatchResponse.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Edit route failed: ${extractMessage(routePatchPayload.json, routePatchPayload.text, 'Unknown upstream error')}`,
                },
                { status: routePatchResponse.status || 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Edit URL to endpoint สำเร็จ',
            serviceName: current.serviceName,
            routeName: current.routeName,
            fqdn: current.fqdn,
            targetUrl,
            path,
        });
    }

    const routeDeleteResponse = await fetch(`${KONG_ADMIN_BASE_URL}/routes/${encodeURIComponent(current.routeName)}`, {
        method: 'DELETE',
        cache: 'no-store',
    });
    if (!routeDeleteResponse.ok && routeDeleteResponse.status !== 404) {
        const routeDeletePayload = await getJsonOrText(routeDeleteResponse);
        return NextResponse.json(
            {
                success: false,
                message: `Delete route failed: ${extractMessage(routeDeletePayload.json, routeDeletePayload.text, 'Unknown upstream error')}`,
            },
            { status: routeDeleteResponse.status || 500 }
        );
    }

    const serviceDeleteResponse = await fetch(`${KONG_ADMIN_BASE_URL}/services/${encodeURIComponent(current.serviceName)}`, {
        method: 'DELETE',
        cache: 'no-store',
    });
    if (!serviceDeleteResponse.ok && serviceDeleteResponse.status !== 404) {
        const serviceDeletePayload = await getJsonOrText(serviceDeleteResponse);
        return NextResponse.json(
            {
                success: false,
                message: `Delete service failed: ${extractMessage(serviceDeletePayload.json, serviceDeletePayload.text, 'Unknown upstream error')}`,
            },
            { status: serviceDeleteResponse.status || 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: 'Delete URL to endpoint สำเร็จ',
        serviceName: current.serviceName,
        routeName: current.routeName,
    });
}

export async function POST(request) {
    try {
        const body = await request.json();

        if (body?.action) {
            return await handleActionRequest(body);
        }

        const { fqdn, destinationIp, destinationPort, notes } = body;

        // Validate inputs
        if (!fqdn || !destinationIp || !destinationPort) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Parse FQDN to separate domain and path
        let domain = fqdn;
        let path = '/';

        // Handle input like "olympusx-jaeger-dashboard.jventures.co.th/path1"
        const firstSlashIndex = fqdn.indexOf('/');
        if (firstSlashIndex !== -1) {
            domain = fqdn.substring(0, firstSlashIndex);
            path = fqdn.substring(firstSlashIndex);
        }

        const serviceName = `svc_${domain}`;
        const routeName = `route_${domain}`;

        // 1. Create Service Command
        const targetUrl = `http://${destinationIp}:${destinationPort}${path}`;
        const createServiceCommand = `curl -s -i -X POST ${KONG_ADMIN_BASE_URL}/services --data name=${serviceName} --data url='${targetUrl}'`;

        // 2. Create Route Command
        const createRouteCommand = `curl -s -i -X POST ${KONG_ADMIN_BASE_URL}/services/${serviceName}/routes --data "hosts[]=${domain}" --data "paths[]=${path}" --data "preserve_host=true" --data "name=${routeName}"`;

        try {
            console.log(`Executing Service Creation: ${createServiceCommand}`);
            const serviceExec = await execPromise(createServiceCommand);
            console.log(`Service Creation Output: ${serviceExec.stdout}`);

            console.log(`Executing Route Creation: ${createRouteCommand}`);
            const routeExec = await execPromise(createRouteCommand);
            console.log(`Route Creation Output: ${routeExec.stdout}`);

            // Combine outputs
            const combinedOutput = `Service Output:\n${serviceExec.stdout}\n\nRoute Output:\n${routeExec.stdout}`;
            const combinedCommand = `${createServiceCommand}\n\n${createRouteCommand}`;

            return NextResponse.json({
                success: true,
                message: 'Map URL request processed successfully.',
                details: {
                    id: 'REQ-' + Math.floor(Math.random() * 10000),
                    status: 'Commands Executed',
                    timestamp: new Date().toLocaleString(),
                    generatedCommand: combinedCommand,
                    output: combinedOutput,
                    notes: notes || '-'
                }
            });
        } catch (execError) {
            console.error('Execution Failed:', execError);
            return NextResponse.json({
                success: false,
                message: 'Command execution failed: ' + execError.message,
                command: execError.cmd
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Execution Failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'An error occurred processing the request: ' + error.message,
                command: error.cmd
            },
            { status: 500 }
        );
    }
}
