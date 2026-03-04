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

async function postForm(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body).toString(),
        cache: 'no-store',
    });
}

async function getServiceByName(serviceName) {
    const response = await fetch(`${BYTEPLUS_ADMIN_BASE_URL}/services/${serviceName}`, {
        method: 'GET',
        cache: 'no-store',
    });

    const rawText = await response.text();
    let json = null;
    try {
        json = JSON.parse(rawText);
    } catch {
        json = null;
    }

    return {
        ok: response.ok,
        status: response.status,
        json,
        rawText,
    };
}

function extractUpstreamMessage(rawText) {
    if (!rawText) return '';
    try {
        const parsed = JSON.parse(rawText);
        if (parsed.message) return parsed.message;
        if (parsed.code || parsed.name) {
            return `${parsed.name || 'Error'}${parsed.code ? ` (${parsed.code})` : ''}`;
        }
        return rawText;
    } catch {
        return rawText;
    }
}

export async function POST(request) {
    try {
        const { scheme, url, endpoint, path } = await request.json();

        if (!url || !endpoint) {
            return NextResponse.json({ success: false, message: 'Missing required fields: url and endpoint' }, { status: 400 });
        }

        const normalizedScheme = (scheme || 'http').trim().toLowerCase();
        if (!['http', 'https'].includes(normalizedScheme)) {
            return NextResponse.json({ success: false, message: 'Invalid scheme. Allowed values: http, https' }, { status: 400 });
        }

        if (!validateEndpoint(endpoint)) {
            return NextResponse.json({ success: false, message: 'Invalid endpoint format. Use <ip>:<port>.' }, { status: 400 });
        }

        const host = normalizeHost(url);
        if (!host) {
            return NextResponse.json({ success: false, message: 'Invalid url value' }, { status: 400 });
        }

        const safeNamePart = normalizeNamePart(host);
        const baseServiceName = `svc_${safeNamePart}`;
        const normalizedPath = normalizePath(path);
        const targetUrl = `${normalizedScheme}://${endpoint}${normalizedPath}`;

        let serviceName = '';
        let suffixNumber = 0;

        while (suffixNumber <= 999) {
            const candidateServiceName = suffixNumber === 0
                ? baseServiceName
                : `${baseServiceName}_${suffixNumber}`;

            const existingService = await getServiceByName(candidateServiceName);

            if (existingService.status === 404) {
                serviceName = candidateServiceName;
                break;
            }

            if (!existingService.ok) {
                return NextResponse.json({
                    success: false,
                    message: `ตรวจสอบชื่อ service ไม่สำเร็จ: ${extractUpstreamMessage(existingService.rawText) || 'Unknown upstream error'}`,
                }, { status: existingService.status || 500 });
            }

            const existingPath = normalizePath(existingService.json?.path || '/');
            if (existingPath === normalizedPath) {
                return NextResponse.json({
                    success: false,
                    message: `Create service failed: mapping นี้มีอยู่แล้ว (${candidateServiceName}, path=${normalizedPath})`,
                    existingServiceName: candidateServiceName,
                }, { status: 409 });
            }

            suffixNumber += 1;
        }

        if (!serviceName) {
            return NextResponse.json({
                success: false,
                message: 'Create service failed: ไม่สามารถหา service name ที่ว่างได้',
            }, { status: 500 });
        }

        const routeName = serviceName.replace(/^svc_/, 'route_');

        const steps = [];

        const serviceResponse = await postForm(`${BYTEPLUS_ADMIN_BASE_URL}/services`, {
            name: serviceName,
            url: targetUrl,
        });

        const serviceText = await serviceResponse.text();
        steps.push({
            step: 'create_service',
            status: serviceResponse.status,
            ok: serviceResponse.ok,
            endpoint: `${BYTEPLUS_ADMIN_BASE_URL}/services`,
        });

        if (!serviceResponse.ok) {
            const upstreamMessage = extractUpstreamMessage(serviceText);
            return NextResponse.json({
                success: false,
                message: `Create service failed: ${upstreamMessage || 'Unknown upstream error'}`,
                serviceStatus: serviceResponse.status,
                serviceResponse: serviceText,
                steps,
            }, { status: serviceResponse.status || 500 });
        }

        const routePayload = {
            'hosts[]': host,
            'paths[]': normalizedPath,
            preserve_host: 'true',
            name: routeName,
        };

        const routeEndpoints = [
            `${BYTEPLUS_ADMIN_BASE_URL}/${serviceName}/routes`,
            `${BYTEPLUS_ADMIN_BASE_URL}/services/${serviceName}/routes`,
        ];

        let routeResponse = null;
        let routeText = '';
        let routeEndpointUsed = '';
        const routeAttempts = [];

        for (const routeEndpoint of routeEndpoints) {
            const response = await postForm(routeEndpoint, routePayload);
            const responseText = await response.text();

            routeAttempts.push({
                endpoint: routeEndpoint,
                status: response.status,
                ok: response.ok,
                response: responseText,
            });

            if (response.ok) {
                routeResponse = response;
                routeText = responseText;
                routeEndpointUsed = routeEndpoint;
                break;
            }
        }

        const successfulRouteAttempt = routeAttempts.find((attempt) => attempt.ok);
        steps.push({
            step: 'create_route',
            ok: Boolean(successfulRouteAttempt),
            endpoint: successfulRouteAttempt ? successfulRouteAttempt.endpoint : routeAttempts[routeAttempts.length - 1]?.endpoint,
            attempts: routeAttempts.map((attempt) => ({ endpoint: attempt.endpoint, status: attempt.status, ok: attempt.ok })),
        });

        if (!routeResponse) {
            const lastAttempt = routeAttempts[routeAttempts.length - 1];
            const upstreamMessage = extractUpstreamMessage(lastAttempt?.response);
            return NextResponse.json({
                success: false,
                message: `Create route failed: ${upstreamMessage || 'Unknown upstream error'}`,
                routeStatus: lastAttempt?.status,
                routeResponse: lastAttempt?.response,
                routeAttempts,
                steps,
            }, { status: lastAttempt?.status || 500 });
        }

        return NextResponse.json({
            success: true,
            scheme: normalizedScheme,
            serviceName,
            routeName,
            serviceSuffix: suffixNumber,
            targetUrl,
            routeEndpointUsed,
            steps,
            serviceResponse: serviceText,
            routeResponse: routeText,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
